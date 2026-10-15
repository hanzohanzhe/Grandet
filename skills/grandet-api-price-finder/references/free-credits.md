# Free credits

Grandet records official free tiers and trial credits (Google, Groq, Mistral, Cloudflare, OpenRouter, NVIDIA and others) and relay sign-up, check-in, invite and free-group offers. Each has six conditions: card, identity (实名), payment, invite, application and renewal, each marked required, not required, conditional or unknown. Grandet does not verify personal eligibility.

## When to use

- The user asks about free API, trial credit, 白嫖, 公益站, 签到, invite rewards, or "有没有能测试的中转站": list a batch.
- The user did not ask, but has already said things that meet the conditions of an offer that covers their model (for example "我是学生", "我有信用卡"): add one line at the end of the price answer, once per conversation, such as "Google 有 Gemini 免费额度，需 Google 账号，要看看吗？" Unknown conditions do not count as met; say "条件未核实".

## Get the data

- Web page for the user: `https://grandet.ai/zh-CN/free-tokens/` (English: `https://grandet.ai/free-tokens/`). Add `?q=<word>` to filter, for example `?q=gemini`.
- Data for you: `https://grandet.ai/public-data/free-tokens.json` (about 1 MB). Do not read it whole. With a shell, filter it; the site rejects requests without a User-Agent:

```sh
python3 - gemini <<'PY'
import datetime, json, sys, urllib.request
q = [w.lower() for w in sys.argv[1:]]
req = urllib.request.Request('https://grandet.ai/public-data/free-tokens.json', headers={'User-Agent': 'grandet-skill/0.3.0'})
d = json.load(urllib.request.urlopen(req, timeout=30))
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
latest = {}
for o in d['offers']:
    if o.get('declaredStatus') in ('ended', 'disabled') or (o.get('endAt') or '9') < now:
        continue
    k = o.get('eventFamilyId') or o['id']
    if k not in latest or o['observedAt'] > latest[k]['observedAt']:
        latest[k] = o
rows = [('relay', o) for o in latest.values()] + [('official', o) for o in d['officialOffers'] if (o.get('activityEndAt') or '9') >= now]
seen = set()
for kind, o in rows:
    blob = json.dumps([o.get(k) for k in ('provider', 'sourceId', 'title', 'titleText', 'benefitText', 'benefitTextLocalized', 'conditions')], ensure_ascii=False).lower()
    if q and not all(w in blob for w in q):
        continue
    title = o['title']['zh-CN'] if isinstance(o.get('title'), dict) else (o.get('titleText') or {}).get('zh-CN') or o.get('title')
    who = o.get('provider') or o.get('sourceId')
    if (who, title) in seen:
        continue
    seen.add((who, title))
    print(json.dumps({'kind': kind, 'who': who, 'title': title, 'category': o.get('category'),
                      'requirements': {k: v.get('state') for k, v in (o.get('requirements') or {}).items()},
                      'claim': o.get('claimUrl'), 'checked': o.get('checkedAt') or o.get('observedAt')}, ensure_ascii=False))
PY
```

Replace `gemini` with the model family or provider the user cares about; pass no word to list everything. Without a shell, open the web page with the filter instead.

## Answer

List up to five offers, the ones covering the user's model first, and include both kinds when they exist: official free tiers and relay offers (sign-up, check-in, invite, free groups). For each: who offers it, what it gives (their words), the conditions that are required (for example "需绑卡、需实名"), the deadline if there is one, and the claim link. Keep each line's hint within 50 characters. Then filter by what the user has told you about themselves; do not ask a list of questions, ask at most one that really changes the result, such as "能绑卡吗？".

Relay groups with ratio 0 ("免费", "公益", "福利" groups) also count as free credits; they come from the price lookup. Groups that only call themselves free but charge a small ratio are paid offers and appear in the price list. "free号 / free逆 / free池" means the site's upstream accounts are free tiers; it is not free credit for the user.

Do not say which free offer is better and do not repeat a provider's quality claims. If the user picks one, connect it the same way as a paid offer ([connect](host-setup.md)); for an official free tier, the API address and key come from that provider's own console.
