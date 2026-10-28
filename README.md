# Human Reproductive System — Interactive 3D Learning Lab

**Live:** https://reproductive-anatomy-lab.vercel.app

Works on phones and tablets: the details rise from the bottom in a sheet you can drag, fold or close with a swipe down, and picking a structure frames it above the sheet.

An interactive 3D female and male reproductive system for university anatomy and physiology:

- **Two bodies.** Switch between the female and male body at any time (`?body=male` opens the male one). Every structure that has a homologue in the other body links to it ("Homologue: Testis (left) ↗"), and **Colour → Origin** paints both bodies by embryological origin (Müllerian duct, Wolffian duct, urogenital sinus, genital tubercle, folds and swellings, gonad).
- **Real look.** The uterus, tubes and ovaries, vagina, vulva and breasts; the testes, epididymides, ducts, seminal vesicles, prostate and penis; with the bladder, rectum, pelvic floor, vessels and bones around them. "Colour" switches to **Layers** (one colour per layer) or **Origin**.
- **Anatomy explorer.** The uterus in its regions (fundus, body, cornua, lower segment, cervix with its os) and walls, the tubes in their four parts, the ligaments, the breast's lobes and ducts; search with synonyms ("womb", "fallopian", "Bartholin", "vas deferens", "Cowper"); fly to the pelvis, the breasts or the perineum; slice the body (the uterus opens to its walls and lining).
- **Menstrual cycle.** An hourly feedback model: FSH, LH, oestradiol, progesterone and inhibin; a follicle chosen and growing in the ovary, the LH surge and ovulation about 36 hours later, the corpus luteum, and the endometrium shed, rebuilt and made secretory. Set the cycle's length; try the combined pill, PCOS, the menopause or an early pregnancy.
- **Fertilisation.** Sperm released in the vagina and thinning out at every barrier on the way to the ampulla, the egg picked up by the fimbriae, fertilisation, cleavage, the morula and blastocyst on their way to the uterus, and implantation (or an ectopic pregnancy). The fertile window from Wilcox 1995.
- **Pregnancy week by week.** The uterus growing to term, the placenta, the fetus (an illustration) with its crown–rump length, weight and fundal height, and the hormones of pregnancy.
- **Birth and milk.** Cervical dilation on the Zhang 2010 curves, contractions in Montevideo units and the Ferguson reflex, the head's path down the birth canal, the placenta delivered; then prolactin, milk volume and the let-down reflex.
- **Sperm production.** The hypothalamus–pituitary–testis loop, spermatogenesis over about 74 days, semen against the WHO 2021 limits, sperm travelling the real ducts; scenarios (vasectomy, Klinefelter, anabolic steroids, varicocele, and more); erection and emission as blood flow and text.
- **Contraception.** Each method acting where it works, in its body, with its perfect- and typical-use failure in the first year (Trussell 2011).
- **Disorders and fertility.** Common disorders of both bodies with their causes, signs, tests and treatment; a reader for hCG, day-21 progesterone, AMH, FSH and LH, and PSA; the steps of IVF.
- **Close-ups and guided tour.** Inside a follicle, fertilisation, the early embryo, placental villi, a seminiferous tubule and a milk alveolus; a 24-step tour across both bodies.

**Educational only.** This is not a clinical tool, and the text has not been reviewed by a physician. Physiology is shown with anatomy and animation only; no sexual acts are shown.

The female body is the HuBMAP Human Reference Atlas female organ set, with the BodyParts3D (DBCLS) pelvic floor, iliac arteries, ribs and sternum fitted onto it; the male body is BodyParts3D. All are CC BY 4.0; see [public/ATTRIBUTION.md](public/ATTRIBUTION.md). **No open scanned model of the endometrium, vulva, female urethra, scrotum or male urethra exists**, so those parts (with the gravid uterus, ovarian vessels, ejaculatory ducts, bulbourethral glands and penile deep arteries) are modelled to textbook size around the real structures, and labelled as modelled.

## Run

Requires Node.js ≥ 22.12.

```sh
npm install
npm run dev            # http://localhost:5194
npm run build          # type-check + production build → dist/
npm run preview        # http://localhost:5195
```

Add `?quality=high` or `?quality=low` to the URL to force a rendering quality. By default the lab drops the costly wet coat and sheen on software renderers and when frames stay slow.

## Check

```sh
npm run typecheck
npm test                         # unit tests (Vitest)
npm run validate:assets          # model hashes, nodes, geometry sanity, baked shading, attribution
npx playwright install chromium  # once
npm run build && npm run e2e     # browser tests (Playwright)
```

See [docs/TESTING.md](docs/TESTING.md) for results and what is not verified, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it is built.

## Rebuild the models

`public/models/female.glb` and `male.glb` are generated from two checkouts:

1. The Female Atlas (`github.com/Niyaz-05/female-atlas`): the HRA united female body.
2. The Human Atlas (`github.com/Niyaz-05/human-atlas`): BodyParts3D.

```sh
node tools/make-structures.mjs
node tools/extract-reproductive.mjs "<female-atlas>/public/models" "<human-atlas>/public/models"
node tools/bake-shading.mjs
node tools/validate-assets.mjs
```

Every step is deterministic, and every input and output is hashed in `src/repro/generated/provenance.json`, with the BodyParts3D fits, the measurements, the layout checks and the routes.

## Deploy

The site is a Vercel project (Vite preset, output `dist/`) deployed with `vercel deploy --prod`.

## Layout

| Path | What |
|---|---|
| `src/contract/` | Simulation schema (zod), approved-asset registry, validation gate |
| `src/repro/` | The two definitions (structures, layers, homologues, origins, tour, sources); the cycle, fertilisation, pregnancy, labour and lactation, spermatogenesis, contraception and disorders models; `live.ts` (what the views show now); anchors and routes; generated geometry and provenance |
| `src/app/` | Pure state reducer (body, modes, colour, cut, close-ups, cycle, fertilisation, week, labour, sperm, method, disorder), mode layers, search, React context |
| `src/viewer/` | three.js / react-three-fiber scene: tissue material and lighting, the model (morphs for the lining and the gravid uterus, cut caps), hormone and sperm particles, follicles, the fetus, close-ups, camera rig, labels |
| `src/ui/` | Panels: structures (colour, cut, layers), details, Cycle, Fertilisation, Pregnancy, Birth, Sperm, Contraception, Disorders, close-up, tour, About; a small SVG chart |
| `tools/` | Structure list, extraction, shading bake and asset validation |
| `tests/unit`, `tests/e2e` | Vitest and Playwright suites |
