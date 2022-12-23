import logging
import os
import sys
import csv
import argparse
from datetime import datetime
from os.path import join, normpath, basename


#CSV Formatter
# AuthorID,Author,Date,Content,Attachments,Reactions

sys.path.append("./")
from src.utils.utils import extract_dict_structure, split_in_sessions, get_dir_files

USER_TAG = "[me]"
OTHERS_TAG = "[others]"
DISCORD_STOP_WORDS = [word.replace('\n', '') for word in open('./data/resources/Discord_stopwords.txt').readlines()]


def save_messages_parsed(output_path, user_messages):
    output_file = os.path.join(output_path, "discord-chats.txt")
    with open(output_file, 'w') as f:
        [f.write(f"{msg}\n") for msg in user_messages]

def load_data(csv_path: str):
    with open(csv_path, 'r') as f:
        #Parse the csv file
        discord_data = csv.reader(f, delimiter=',')
    return discord_data

def stop_word_checker(actor, invalid_lines, text):
    if type(text) != str:  # Telegram save links under 'text' key, but they are dictionary / list
        invalid_lines.append(f"[STOP_WORD] {actor} - {text}")
        return True
    for stop_word in DISCORD_STOP_WORDS:
        if stop_word in text:
            invalid_lines.append(f"[STOP_WORD] {actor} - {text}")
            return True
    return False

def messages_parser(discord_data, session_info, usr_id):
    datetime_format = session_info['time_format']
    usr_messages = []
    invalid_lines = []
    t_last = None

    for row in discord_data:
        actor = row[0]
        text = row[3]
        t_current = datetime.strptime(row[2], datetime_format)

        split_in_sessions(t_current,
                                  t_last,
                                  usr_messages,
                                  session_info['delta_h_threshold'],
                                  session_info['session_token'])
        t_last = t_current

        if stop_word_checker(actor, invalid_lines, text):
            continue

        msg_prefix = USER_TAG if actor == usr_id else OTHERS_TAG
        usr_messages.append(f"{msg_prefix} {text}")
    
    logging.info(f'Found {len(invalid_lines)} invalid lines')
    
    return usr_messages

def run(csv_path: str,
        output_path: str,
        session_token: str,
        delta_h_threshold: int,
        time_format: str,
        discord_user_id: str
        ):
    session_info = {"session_token": session_token,
                    "delta_h_threshold": delta_h_threshold,
                    "time_format": time_format}
    
    txt_files_name, txt_files_paths = get_dir_files(dir_path=csv_path, extension_filter=".csv")
    logging.info(f"Found {len(txt_files_paths)} txt files in `{csv_path}` folder: {txt_files_paths}")

    logging.info(f"Loading Discord data at {csv_path}...")
    #discord_data = load_data(csv_path)

    logging.info(f"Start parsing Discord messages...")
    #user_messages = messages_parser(discord_data, session_info)

    all_data = []
    for file_name, file_path in zip(txt_files_name, txt_files_paths):
        discord_data = load_data(file_path)
        user_messages = messages_parser(discord_data, session_info, discord_user_id)
        all_data.extend(user_messages)
        all_data.append(session_info['session_token'])

    logging.info(f"Saving {len(user_messages)}^ Discord messages...")
    save_messages_parsed(output_path, all_data)

def main(argv):
    parser = argparse.ArgumentParser(prog=argv[0])
    parser.add_argument('--csv_path', type=str, required=False, default="./data/chat_raw/discord/",
                        help="Path to the concatenated Discord CSVs created from Discord Chat Exporter")
    parser.add_argument('--output_path', type=str, default="./data/chat_parsed/")
    parser.add_argument('--session_token', type=str,
                        help="Add a 'session_token' after 'delta_h_threshold' hours"
                             "are elapsed between two messages. This allows splitting in sessions"
                             "one chat based on messages timing.")
    parser.add_argument("--delta_h_threshold", type=int, default=4,
                        help="Hours between two messages to before add 'session_token'")
    
    parser.add_argument("--discord_user_id", type=str, default="", help="Discord User ID of the person that is being modeled")

    parser.add_argument("--time_format", type=str, default="%Y-%m-%dT%H:%M:%S",
                        help="The Discord format timestamp. Default is Italian format.")
    parser.add_argument("-v", "--verbose", help="increase output verbosity", action="store_true")
    args = parser.parse_args(argv[1:])
    loglevel = logging.DEBUG if args.verbose else logging.INFO
    process_name = basename(normpath(argv[0]))
    logging.basicConfig(format=f"[{process_name}][%(levelname)s]: %(message)s", level=loglevel, stream=sys.stdout)
    delattr(args, "verbose")
    run(**vars(args))


if __name__ == '__main__':
    main(sys.argv)