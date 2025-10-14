#!/usr/bin/env python3
"""
Test your CoachMatch Lambda WITHOUT needing the Riot API key.

Two modes:
  1) apigw  – call your API Gateway HTTPS endpoint
  2) lambda – invoke the Lambda function directly via AWS SDK

Usage examples:
  python3 test_coach_match_no_riot.py apigw --game-name YasserSalem --tag RANK \
      --match-id EUW1_7564503755 --url https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach_match

  python3 test_coach_match_no_riot.py lambda --game-name YasserSalem --tag RANK \
      --match-id EUW1_7564503755 --function arn:aws:lambda:us-east-1:078083765111:function:CoachMatch
"""

import argparse
import json
import sys

def summary_print(data: dict):
    """Print a compact health summary of the CoachMatch response."""
    meta = data.get("meta", {})
    acct = data.get("account", {})
    participants = data.get("participants", []) or []
    teams = data.get("teams", []) or []
    ts = data.get("timeSeries", {})
    buckets = (ts.get("buckets") or [])
    print("\n=== CoachMatch Summary ===")
    print(f"MatchId: {meta.get('matchId')}  Queue: {meta.get('queueId')}  Mode: {meta.get('gameMode')}")
    print(f"GameDuration(s): {meta.get('gameDurationSeconds')}")
    print(f"Focus Account: {acct.get('gameName')}#{acct.get('tagLine')}  PUUID: {acct.get('puuid')}")
    print(f"Teams: {len(teams)}  Participants: {len(participants)}")
    print(f"Time grid: {ts.get('intervalSeconds')}s  Buckets: {len(buckets)}  Has allEvents: {'allEvents' in ts}")
    if participants:
        me = next((p for p in participants if p.get('puuid') == acct.get('puuid')), None)
        if me:
            print(
                f"Your champ: {me.get('championName')}  Role: {me.get('role')}  "
                f"K/D/A: {me.get('kills')}/{me.get('deaths')}/{me.get('assists')}  "
                f"CS/min: {me.get('csPerMin')}  KP%: {me.get('killParticipation')}"
            )
    print("==========================\n")


def do_apigw(args):
    import urllib.parse
    import urllib.request

    if not args.url:
        print("❌ apigw mode requires --url (your API Gateway endpoint).", file=sys.stderr)
        sys.exit(1)

    qs = urllib.parse.urlencode({
        "gameName": args.game_name,
        "tagLine": args.tag,
        "matchId": args.match_id,
    })
    url = f"{args.url}?{qs}"
    req = urllib.request.Request(url, method="GET", headers={
        "Accept": "application/json",
        "User-Agent": "coach-match-tester/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8", "ignore")
            if resp.status != 200:
                print(f"❌ API returned {resp.status}: {body}", file=sys.stderr)
                sys.exit(2)
            try:
                data = json.loads(body)
            except Exception:
                print("❌ Response not JSON:\n", body, file=sys.stderr)
                sys.exit(2)
    except Exception as e:
        print("❌ Request failed:", e, file=sys.stderr)
        sys.exit(2)

    summary_print(data)


def do_lambda(args):
    """
    Direct Lambda invoke via boto3 (no Riot key needed).
    Requires AWS credentials (env vars, profile, or instance role) with lambda:InvokeFunction.
    """
    import boto3

    if not args.function:
        print("❌ lambda mode requires --function (name or ARN).", file=sys.stderr)
        sys.exit(1)

    client = boto3.client("lambda", region_name=args.region)
    payload = {
        "httpMethod": "GET",
        "path": "/coach_match",
        "queryStringParameters": {
            "gameName": args.game_name,
            "tagLine": args.tag,
            "matchId": args.match_id,
        },
    }

    resp = client.invoke(
        FunctionName=args.function,
        InvocationType="RequestResponse",
        Payload=json.dumps(payload).encode("utf-8"),
    )

    if "Payload" not in resp:
        print("❌ No Payload from Lambda.", file=sys.stderr)
        sys.exit(2)

    raw = resp["Payload"].read().decode("utf-8", "ignore")
    # If your Lambda uses proxy integration, it returns {statusCode, headers, body}
    try:
        outer = json.loads(raw)
    except Exception:
        print("❌ Lambda outer response not JSON:\n", raw, file=sys.stderr)
        sys.exit(2)

    status = outer.get("statusCode", 200)
    body = outer.get("body", "{}")
    try:
        data = json.loads(body)
    except Exception:
        print(f"❌ Lambda body not JSON (status={status}):\n{body}", file=sys.stderr)
        sys.exit(2)

    if status != 200:
        print(f"❌ Lambda error (status={status}):\n{json.dumps(data, indent=2)}", file=sys.stderr)
        sys.exit(2)

    summary_print(data)


def main():
    p = argparse.ArgumentParser(description="Test CoachMatch Lambda without Riot API key.")
    sub = p.add_subparsers(dest="mode", required=True)

    # API Gateway mode
    a = sub.add_parser("apigw", help="Call API Gateway HTTPS endpoint (no signing if public).")
    a.add_argument("--url", required=True, help="Full API Gateway URL, e.g. https://.../coach_match")
    a.add_argument("--game-name", required=True)
    a.add_argument("--tag", required=True)
    a.add_argument("--match-id", required=True)
    a.set_defaults(func=do_apigw)

    # Direct Lambda invoke mode
    l = sub.add_parser("lambda", help="Invoke Lambda via AWS SDK (boto3).")
    l.add_argument("--function", required=True, help="Lambda function name or ARN")
    l.add_argument("--region", default="us-east-1")
    l.add_argument("--game-name", required=True)
    l.add_argument("--tag", required=True)
    l.add_argument("--match-id", required=True)
    l.set_defaults(func=do_lambda)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
