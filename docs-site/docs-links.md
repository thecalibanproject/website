# Console to docs link contract (2026-10-13)

The console links to user docs with relative URLs under `/docs/`. The docs site must publish every page below, with at least the listed anchors. The console must link only to pages and anchors in this list. Either side may propose additions in its report; the lead merges them here.

Diataxis type in brackets. Slugs are final.

## Start [tutorial]
- /docs/start/ : what Caliban is, the two roles (IT admin, assistant owner), where to begin
- /docs/start/gateway-quickstart/ : put Caliban in front of the model you already use (OpenAI-compatible base URL, your own key, first request, see it in Usage). Anchors: #point-your-app, #protect-personal-data, #see-the-request
- /docs/start/first-assistant/ : build, test and launch an assistant from a template. Anchors: #pick-a-template, #connect-data, #try-it, #go-live
- /docs/start/sandbox/ : the sample workspace and how to reset it

## How-to guides [how-to]
- /docs/guides/models/ : #add-a-model-server, #add-a-model, #external-providers, #local-models
- /docs/guides/workspaces/ : #create, #privacy, #limits-and-budget, #apps-and-keys, #provider-accounts
- /docs/guides/privacy/ : #modes, #custom-patterns, #dictionary, #check-what-the-model-saw
- /docs/guides/data-connections/ : #connect-mongodb, #scan-the-schema
- /docs/guides/data-dictionary/ : #review-suggestions, #bulk-approve, #versions
- /docs/guides/topics/ : #add-a-topic, #examples, #send-to-an-assistant, #fix-a-misroute, #test-a-sentence
- /docs/guides/assistants/ : #create-from-template, #edit-with-the-form, #edit-json, #budgets, #versions
- /docs/guides/knowledge/ : #create-a-library, #upload-documents, #held-back-documents
- /docs/guides/tests-and-go-live/ : #test-cases, #save-a-run-as-a-test, #run-tests, #the-bar, #go-live, #write-tools-in-tests
- /docs/guides/approvals/ : #what-needs-approval, #approve-or-reject, #notifications
- /docs/guides/connected-systems/ : #add-a-tool-server, #approve-a-tool
- /docs/guides/conversations-and-runs/ : #read-a-run, #timeline, #costs
- /docs/guides/usage-and-costs/ : #usage, #spend-caps, #timings
- /docs/guides/audit/ : #read-the-log, #verify-the-chain
- /docs/guides/people-and-roles/ : #roles, #invite, #single-sign-on
- /docs/guides/api-keys/ : #create, #scopes, #rotate

## Concepts [explanation]
- /docs/concepts/how-routing-works/
- /docs/concepts/how-privacy-works/
- /docs/concepts/safety-model/ : untrusted data, approvals, the injection tests
- /docs/concepts/assistants-and-versions/
- /docs/concepts/data-dictionary/
- /docs/concepts/caching/

## Reference [reference]
- /docs/reference/glossary/ : one anchor per term, slug of the plain term (e.g. #workspace, #topic, #query-plan). Old internal names (tenant, intent, CQIR, node, pass^k, taint) are listed and point to the plain term.
- /docs/reference/api/ : the admin and data plane HTTP API
- /docs/reference/assistant-spec/ : the JSON spec (node.schema.json), field by field
- /docs/reference/limits/
- /docs/reference/configuration/

## Added by the docs site (2026-10-13), proposed for the contract
- /docs/ : the docs landing, with the two reader paths and the developer path
- /docs/start/install/ : install and check (IT admin tutorial)
- /docs/reference/sdks/ : the Python and TypeScript SDKs
- /docs/reference/response-headers/ : x-caliban-* headers, Server-Timing, the `caliban` request field, Idempotency-Key
- /docs/reference/errors/ : status codes and error codes
- /docs/reference/glossary/ : plain terms. Anchors: #workspace, #sample-workspace, #api-key, #what-it-may-read, #role, #provider-account, #gateway-address, #admin-service, #audit-log, #tamper-check, #model-server, #trust-tier, #automatic-routing, #fixed-model, #topic, #example-sentences, #which-model-answers, #tokens, #assistant, #step, #sub-assistant, #assistant-spec, #template, #version, #draft, #ready-to-test, #live, #archived, #version-fingerprint, #go-live, #tests, #test-case, #safety-tests, #passed-every-time, #grader, #go-live-rules, #data-connection, #scan, #data-dictionary, #entry, #query-plan, #knowledge, #document-library, #held-for-review, #from-outside, #personal-data, #hide-and-restore, #hide-everywhere, #placeholder, #untrusted, #data-labels, #answer-check, #connected-system, #approvals, #conversation, #reuse-identical-answers, #reuse-similar-answers
- /docs/reference/glossary/ : old and API names. Anchors: #tenant, #node, #node-spec, #vertex, #subnode, #intent, #exemplar, #caliban-auto, #pinned, #cqir, #ontology, #datasource, #introspection, #rag, #collection, #quarantined, #eval, #golden-set, #injection-suite, #passk, #promotion-bar, #judge, #pii, #reversible, #mask, #surrogate, #taint, #answer-guard, #mcp, #inbox, #run, #byok, #data-plane, #control-plane, #hash-chain, #exact-cache, #semantic-cache
- /docs/reference/glossary/ : aliases for the console's table (web/src/lib/docs.ts). Anchors: #test-cases, #go-live-bar, #untrusted-data, #trust-level
