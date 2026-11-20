# ATLAS — publication audit

**Project:** ATLAS / TVmaze API  
**Repository:** https://github.com/andpet03/TV-Maze-API-project  
**File inspection:** 19 November 2026  
**Report prepared:** 20 November 2026

## Scope and method

This audit follows the course publication checklist: secrets and sensitive data, excluded files, ignore rules, dependencies, setup, configuration and README completeness. It records findings, corrective actions, repeated checks and remaining limitations.

Evidence consisted of three author-supplied GitHub ZIP downloads, the local submission candidate, supporting documentation and author-supplied screenshots. Inspection was read-only: application code and tests were not executed, application files were not changed, and no commit or push was made during inspection. Preparing this report is separate from that inspection.

The available project directory is not a Git checkout, and the ZIPs contain no Git history. Git status, tracked/untracked files and historical commits could not be inspected. The live repository, its settings and deployment were not independently verified.

## Checks performed

| Area | Result |
| --- | --- |
| Secrets and credentials | No matches were found for the checked private-key, token and credential-assignment patterns in inspected text files. This limited scan does not guarantee the absence of secrets. |
| Sensitive material | Configuration, documentation and supplied screenshots were reviewed for publication concerns. No sensitive material requiring removal was identified in that review; this was not an exhaustive personal-data assessment. |
| Excluded files | No environment configuration, dependency directory, cache directory or generated browser-test artifacts were found in the reviewed package. |
| `.gitignore` | Covers `node_modules/`, `artifacts/`, `.env`, `.env.*`, `__pycache__/`, `.DS_Store` and `Thumbs.db`. No immediate omission was confirmed for this package. Ignore rules do not prove that historical commits are clean. |
| Application completeness | The third repository download contains the complete original 26-file package, including styles, scripts, assets, documentation, tests and workflow. |
| Local references | Referenced local files in the current `index.html` and README exist, including seven screenshots. |
| Dependencies and setup | `package.json` and README were inspected. Production needs no npm packages or build step. Logic checks use Node.js 20 or newer. Optional browser tests require separately installed Playwright and Chromium. Local-server instructions are documented. |
| Configuration examples | Secret configuration is not applicable: the app uses public TVmaze endpoints and browser-local storage, with no API key or backend database. The README explains this. |
| README coverage | Revised local README covers purpose, collection, persistence, interaction, setup, learning, limitations and assistance. |
| Visual evidence | Seven author-supplied screenshots are included locally and linked from README. They demonstrate specific states, not comprehensive functional testing. |
| Automated checks | `.github/workflows/tests.yml` exists in the third download, uses Node 22 and runs declared syntax/logic checks with read-only repository-content permission. Execution success remains unverified. |
| Attribution and assistance | `LICENSE`, `ATTRIBUTION.md` and README distinguish application code from provider content and disclose AI assistance. A screenshot-related clarification is recommended below. |

## Confirmed issues, fixes and rechecks

| Finding and location | Action taken | Recheck and status |
| --- | --- | --- |
| **Missing supporting folders:** first download contained only seven root files. `index.html` referenced missing styling, scripts and assets; documentation and tests were also absent. | Author added `assets/`, `css/`, `js/`, `docs/` and `tests/`, preserving paths. | Second download contained 25 files. Third contained all 26 original package files. **Resolved in supplied repository snapshots.** |
| **Missing workflow:** `.github/workflows/tests.yml` was absent from the second download. | Author created the file directly on GitHub after folder dragging failed. | Correct path/content appeared in a screenshot and the third ZIP. Referenced scripts/files exist. **Presence resolved; execution not verified.** |
| **README completeness:** documentation needed explicit learning reflection and clear coverage of required topics. | Prepared expanded README from author feedback and the development process. | Seven required topics, setup, limitations and AI disclosure checked locally; local links resolve. **Resolved locally; latest remote upload not independently confirmed.** |
| **Missing visual evidence:** a written demo script existed, but screenshots or a recorded demonstration were absent. | Added seven images under `docs/screenshots/` and README captions. | All image references resolve locally. **Resolved locally; latest remote upload not independently confirmed.** |
| **Missing audit record:** `AUDIT.md` was absent from inspected snapshots. | Prepared this sanitized report. | **Ready for repository inclusion; publication requires confirmation.** |

Archive comparison evidence:

- `TV-Maze-API-project-main.zip`: 7 files, no supporting folders.
- `TV-Maze-API-project-main (2).zip`: 25 files; workflow missing.
- `TV-Maze-API-project-main (3).zip`: 26 files, matching the original final application package.

The later local candidate, before this report, contains 33 files: the original package with a revised README and seven new screenshots. No application-code difference was found between that candidate and the third archive. These comparisons establish the supplied snapshots, not the current remote repository state.

## Recommended improvements and remaining actions

1. **Clarify screenshot attribution — `ATTRIBUTION.md`.** Its statement that no poster collection is bundled should distinguish runtime-loaded posters from artwork visible in documentation screenshots. Retain provider attribution and the existing rights distinction. This is a documentation clarification, not a finding of unlawful inclusion.
2. **Confirm latest publication.** After uploading the revised README, screenshots and this report, download the repository again and verify file paths and rendered image links.
3. **Inspect GitHub Actions.** Check the latest run, record its actual result and investigate failures. Workflow presence does not establish passing tests.
4. **Check public access and deployment.** Open the repository and intended application URL while logged out. Published source and a working hosted application are separate checks.
5. **Complete interactive verification.** Check saving/reordering favourites, watched progress after reload, stable catalogue browsing, error recovery and recommendation limits. These were not established by this read-only audit.

No credential exposure was confirmed in the inspected ATLAS files; no secret rotation is claimed or required by these findings. Historical commits were unavailable. If a secret is subsequently found in Git history, revoke or rotate it and remove it from history before publication.

## Verification limits

- Earlier development records report 37 passing logic tests, syntax checks and static-reference checks. They were **not rerun during this audit**, and do not establish a passing GitHub Actions run.
- Earlier automated browser testing was blocked by Chromium startup restrictions. No successful end-to-end browser run is claimed.
- Screenshots show the home page, discovery, an empty watchlist, catalogue filtering and a Spin the wheel result with two 30-minute episodes fitting a 60-minute budget. They do not establish all interactions, persistence, accessibility or cross-browser behaviour.
- Static review found escaped provider text, summaries converted to plain text, restricted poster URLs and backup validation. Their presence is not a complete security assessment.
- First-time catalogue loading takes time; filters use downloaded records. Recommendations depend on the available candidate pool, runtime information and locally recorded watched history.
- Personal state is browser-local, can be cleared and does not synchronise automatically across devices. Personal backup exports should not be committed as test fixtures.
- Git history, tracked-file status, repository visibility, live deployment and the latest remote documentation state could not be verified from the supplied snapshots.

## Conclusion and assistance

Confirmed missing-file problems were corrected in the supplied repository downloads. README and screenshot improvements were checked locally. Remaining publication and functional checks are recorded above rather than treated as completed.

ChatGPT/Codex assisted with inspection, comparison and report preparation. The author supplied repository downloads and screenshots, reviewed findings and performed GitHub upload corrections. No secrets are reproduced here. Finding no issues in a limited check does not prove complete safety or correctness.

The separate audit evidence PDF required for course submission remains a distinct deliverable; this repository record does not replace it.
