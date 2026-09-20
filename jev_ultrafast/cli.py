"""jev-ultrafast CLI: `jev-ultrafast --url URL --goal 'A narrow goal'` (repeat --goal for a list)."""

import argparse

from jev_ultrafast import Agent


def main():
    parser = argparse.ArgumentParser(prog="jev-ultrafast")
    parser.add_argument("--url", required=True)
    parser.add_argument(
        "--goal",
        action="append",
        required=True,
        help="Repeat for an ordered list of goals.",
    )
    args = parser.parse_args()
    with Agent(args.url, args.goal) as agent:
        for state in agent.run():
            print(f"{state['elapsed_ms']:>5} ms  {len(state['history'])} actions  {state['status']}")
        print(state["page"]["url"])


if __name__ == "__main__":
    main()