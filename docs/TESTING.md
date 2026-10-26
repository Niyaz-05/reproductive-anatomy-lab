# Testing

Results recorded on 2026-10-23 on Windows 11, Node 22.14.0. Browser tests ran in headless Chromium (Playwright 1.64, software WebGL via SwiftShader, which uses the automatic low-quality mode). The GPU check ran in installed Google Chrome on an AMD Radeon integrated GPU (ANGLE, Direct3D 11).

## Commands

| Check | Command | What it covers |
|---|---|---|
| Types | `npm run typecheck` | TypeScript strict, `noUncheckedIndexedAccess` |
| Unit | `npm test` | **Definitions:** both pass the validation gate with no warnings; an unapproved asset and a missing left/right partner are rejected; one mesh structure per model node; every left/right part on its side (the vulva about this body's vaginal opening); https-only sources, and the modelled parts say so; homologues link both bodies; every tour step checked against its own body. **Layout:** the extractor's checks; the cervix between bladder and rectum, the ovaries beside the uterus, the vulva below the symphysis; the prostate below the bladder, the seminal vesicles behind it, the testes in the scrotum; organ sizes in plausible ranges; the fits within their limits. **Routes:** no jump over 12 mm; sperm from the vagina to the ampulla, the egg into the tube, male sperm from the testis past the prostate to the tip of the urethra. **Reducer:** each mode's layers, the cut's uterus swap, clamping, the lining through the cycle and the uterus through pregnancy, contraception driving the cycle, vasectomy blocking the sperm route, tour steps in their own body, a body switch carrying the mode and pick. Search in both bodies; the structure list names every mesh once; `closeHoles` on synthetic meshes and all 183 model meshes. **Science:** the LH surge and ovulation timing, hormone peaks, the lining, follicle selection, a 14-day luteal phase at any cycle length, the pill, PCOS, hCG rescue; sperm loss at each barrier, the Wilcox probabilities, the embryo's stages and journey; Robinson and Hadlock, fundal height, hCG and blood volume; Zhang dilation, the Ferguson reflex, colostrum and prolactin; testis hormones and semen in range, steroids, Klinefelter and vasectomy, spermatogenesis timing; contraception ranking, the test reader's thresholds, complete disorders |
| Assets | `npm run validate:assets` | Each GLB's sha256 = provenance and the recorded baked hash, node set = geometry record, finite positions in range, unit normals, indices in range, triangle counts, baked `_TISSUE` on every mesh, only the `endometrium` and `gravid-uterus` morph targets; the attribution names HuBMAP, Kristen Browne, the DOI, BodyParts3D, DBCLS, CC BY 4.0, the modelled parts and the source and output hashes |
| Determinism | re-run `tools/extract-reproductive.mjs` then `tools/bake-shading.mjs` | Byte-identical `female.glb` and `male.glb` |
| Build | `npm run build` | Type check + production bundle |
| E2E | `npm run build && npm run e2e` | 25 scenarios below; screenshots in `docs/screenshots/` |

## E2E scenarios (`tests/e2e/lab.spec.ts`)

1. Loads the female body with no console errors and a clean main screen.
2. Clicking the model selects the structure under the pointer.
3. Search finds structures by name and synonym ("womb", "fallopian", "Bartholin").
4. The uterus lists its parts, a part links back, and a modelled part says so.
5. A homologue (left ovary) opens its partner (left testis) in the male body.
6. Colour by layers and by origin repaint the model; the origin legend shows.
7. Layers hide and show structures (the pregnancy layer shows the placenta).
8. Isolate, Zoom to and Reset.
9. Camera presets and region buttons change the view.
10. Labels mode shows labels that do not overlap.
11. The cut opens the uterus to its walls and lining, faces the camera, flips and turns off.
12. Cycle: the surge and ovulation, the secretory lining, a longer cycle, the pill and PCOS, the follicle close-up.
13. Fertilisation: the stages to the blastocyst, an ectopic pregnancy, the embryo close-up.
14. Pregnancy: fundal height at 20 weeks, fetal weight at term, the villi close-up.
15. Birth: the first and second stages, Montevideo units, breastfeeding milk volume, the alveolus close-up.
16. Sperm switches to the male body: semen analysis (normal, vasectomy, Klinefelter), the arousal step, the spermatid stage, the tubule close-up.
17. Contraception: perfect and typical failure; the vasectomy switches to the male body.
18. Disorders: PCOS, the test reader (progesterone, PSA), a male disorder switches body.
19. The guided tour (24 steps) crosses both bodies, steps back, and finishes.
20. `?body=male` opens the male body.
21. Phone 390×844: no horizontal overflow; Structures opens from the dock; picking shows the details.
22. About: HuBMAP, BodyParts3D and the science credits; Escape closes.
23. `?nowebgl`: fallback message; the list, details and panels still work.
24. Missing model (HTTP 404): error alert; Try again refetches and loads.
25. Reduced motion: the animated views and close-ups work without errors.

## Results

| Check | Result |
|---|---|
| `npm run typecheck` | **Pass** |
| `npm test` | **Pass**: 53/53 in 4 files |
| `npm run validate:assets` | **Pass**: female 123 nodes, 288,828 triangles, sha256 `38c00ebb3140…`; male 60 nodes, 116,078 triangles, sha256 `a41c18f4d327…` |
| Determinism | **Pass**: re-extraction and re-baking give byte-identical `female.glb` and `male.glb` |
| `npm run build` | **Pass**. Vite warns about chunk size (1.88 MB of JavaScript, mostly three.js) |
| `npm run e2e` | **Pass**: 25/25 over three runs (the first two were cut short when the computer slept; each test passed in its last run). Tests 1–3, 5–7 and 9–15 ran before the body-switch CSS fix below, which changes only that control's pointer events |
| GPU check (Chrome, AMD Radeon, D3D11) | Every mode and all 24 tour steps render with no console errors; ready in about 10 s. Anatomy 61 fps, Cycle 61, Fertilisation 35, Pregnancy 30, Birth 21, Contraception 33, Disorders 61, Sperm 36, male Anatomy 61. The first visit to an animated view stalls for about a second while its shaders compile |

## Defects found and fixed during QA

- **The Female/Male switch could not be clicked.** The title area lets pointer events through to the model, and the switch inherited that; only the keyboard and the automatic switches worked. The switch now takes pointer events, and the `?body=male` test clicks it.
- **The cycle view was blocked by the iliac vessels.** Those layers are hidden in the cycle; the ovarian vessels are shown instead.
- **The fetus looked like a stack of spheres.** It is now a curled trunk with flexed limbs, turned to the mother's right, head down from about 32 weeks.
- **The fetal head was hidden behind the pelvis in labour.** The bones are see-through in the birth view.
- **Breastfeeding still showed the fetus and framed the pelvis.** After the birth the fetus and placenta go, the uterus shrinks back, and the camera frames the breasts.
- **The cervix dial was oversized and the structure list showed "Testis" twice without sides**: CSS and list labels fixed.
- **Two tour steps were badly framed** (the tubes, breastfeeding): their focus and camera were changed.
- **The right areola keeps 4 open edges** that are not a closed rim, so the cut cannot cap them; the test allows up to 4 such edges and says why.
- **Tests:** the structure list adds "hidden" to a hidden part's button, which the first version of the tests did not allow for; the tests that load the second body under software WebGL needed the longer time limit.

## Not verified

- **Physical devices other than one AMD integrated GPU.** No phone, tablet or discrete GPU was tested. Firefox and Safari were not run.
- **Automated accessibility audit.** axe-core is not installed; keyboard paths and ARIA labels were checked by hand and by E2E only.
- **Medical review.** The text follows OpenStax A&P 2e, Gray's Anatomy, Williams Obstetrics and the cited papers and guidelines; no gynaecologist, obstetrician or andrologist has reviewed it.
- **The physiology models are teaching models.** The cycle is a feedback model with textbook timings; the fertility, pregnancy and labour numbers are published population averages; failure rates are first-year population figures. None is for diagnosis, dating a pregnancy, managing labour or choosing contraception.
- **The fit of BodyParts3D onto the female body is approximate**: 4.2 mm bone-surface RMS after the warp; the pelvic floor and iliac arteries come from a male body.
- **Modelled parts and illustrations.** The endometrium, gravid uterus, vulva, female urethra, ovarian vessels, scrotum, male urethra, ejaculatory ducts, bulbourethral glands and the penile deep arteries are built in code to real sizes; the fetus, follicles, sperm, egg and embryo and the close-ups are illustrations. The HRA reference organs are small for an adult (a 15 mL uterus, 1 mL ovaries), and the text gives the textbook ranges beside them.
