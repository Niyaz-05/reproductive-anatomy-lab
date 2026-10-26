# Architecture

The reproductive lab shares the heart, lungs, brain, digestive, eye, kidney and endocrine labs' design: a validated, data-only **`SimulationDefinition`** rendered by a generic viewer. The code is a deliberate copy of the endocrine lab, not a shared package, so each lab deploys independently.

## Differences from the endocrine lab

| Area | Reproductive |
|---|---|
| Two bodies | `femaleDefinition` and `maleDefinition` (`src/repro/definition.ts`), each with its own model, structures, layers, regions and structure-list sections. `App.tsx` holds `{body, init, key}` and remounts `LabProvider` with a `LabInit` (mode, tour step, method, disorder, labels, colour, selection) when the body changes, so each body's state starts clean but carries what the user was doing. Modes that belong to one body (`Sperm` → male; `Cycle`, `Fertilisation`, `Pregnancy`, `Birth & milk` → female) switch to it; so do a contraceptive method, a disorder, a tour step and a homologue link that belong to the other body |
| Contract | Modes `explore` / `cycle` / `fertilisation` / `pregnancy` / `birth` / `sperm` / `contraception` / `disorders` / `tour`. Structures carry an embryological `origin` and a `homologue` in the other body. Tour steps name their `body` and can set a mode, cycle day and scenario, fertilisation day, week, labour hour, sperm scenario, method, disorder, close-up, cut, colour and whether to isolate and tint the focus |
| Validation | Each definition is validated on its own with the shared checks (every `-left` mesh needs its `-right` partner and names its side). The unit tests check the rest: each part lies on its side in the model (the vulva's parts measured about this body's vaginal opening, which sits off the midline), homologues exist in the other body, and the other body's tour steps name its structures |
| Science (`src/repro/`) | `cycle.ts`: an hourly feedback model (FSH and LH held down by oestradiol, progesterone and inhibin; a surge once oestradiol stays high for about 36 h; ovulation about 36 h later; a 14-day corpus luteum unless hCG rescues it); the follicle's growth rate is found by bisection so the cycle has the chosen length; pill, PCOS, menopause, pregnancy. `fertilisation.ts`: Wilcox 1995 fertile window, sperm numbers at each barrier, the embryo's stages and position. `pregnancy.ts`: Robinson CRL, Hadlock weight, fundal height, placenta, hCG, progesterone, oestriol, hPL. `labour.ts`: Zhang 2010 dilation, contractions and Montevideo units, the Ferguson reflex; lactation (prolactin, milk volume, let-down). `spermatogenesis.ts`: the HPT loop with scenarios, the stages over about 74 days, WHO 2021 semen limits, arousal steps. `contraception.ts`: Trussell/CDC failure rates and where each method acts. `disorders.ts`: disorders and the test reader. `live.ts` turns the state in effect into morph weights, flows, the fetus and the overlays. All pure and unit-tested |
| Model (`ReproModel.tsx`) | Two morph targets in the female GLB: `endometrium` (lining thickness) and `gravid-uterus` (the real uterus wrapped by an icosphere, morphing to the term shape). The placenta set follows the uterus: p′ = anchor + s(p − termAnchor), with the anchor moving from its first-trimester site to its term site as the uterus grows; the tubes and ovaries shift with the cornua. A cut through the uterus hides its region patches and shows the closed walls and the lining. Shaders compile once at load |
| Overlays | `HormoneFlow.tsx`: hormone particles along route paths; `SpermFlow`: 160 instanced sperm (head and tail) per route, thinning out by survival; `RouteMarker`: the egg and embryo. `Overlays.tsx`: the follicle cohort, dominant follicle and corpus luteum on the ovaries; the fetus (a curled trunk with flexed limbs and a head scaled by week, facing the mother's right, head down from about 32 weeks, following the birth route in labour) and its cord to the placenta |
| Close-ups (`CloseUps.tsx`) | Built in local units and scaled into place while the body is hidden: a follicle (oocyte, zona, granulosa, theca, antrum), fertilisation (corona, zona, acrosome reaction, fusion), the embryo by day (2-cell → blastocyst hatching), placental villi (maternal blood in the intervillous space, fetal capillaries), a seminiferous tubule (Sertoli cells, the stages to the lumen, Leydig cells outside), a milk alveolus (myoepithelial let-down) |
| Colour | Real, Layers, and Origin (embryological origin, the same colours in both bodies, so homologues match) |

The real-tissue look (`tissue.ts`, `Lighting.tsx`, `tools/bake-shading.mjs`) is the same in every lab.

## Asset pipeline

```
HRA united female v1.5 (y − 0.7948 m): uterus regions and walls, cervix, tubes,   ─┐
  ovaries, ligaments, vagina, breasts, term placenta set, bladder, rectum, pelvis, │
  vessels                                                                          │
BodyParts3D (Human Atlas) ─ pelvis fit (Horn → ICP → Gaussian warp), thorax fit:   ├─ tools/extract-reproductive.mjs
  pelvic floor, iliac arteries, ribs, sternum (female); the whole male body        │
Modelled: endometrium + morph, gravid uterus + morph, vulva, female urethra,        │
  ovarian vessels; scrotum, urethra parts, ejaculatory ducts, Cowper's glands,      │
  corpora cavernosa split, deep arteries                                           ┘
        │  123 + 60 nodes; measurements; layout checks; routes
        └─ tools/bake-shading.mjs ─▶ public/models/female.glb (6.1 MB) · male.glb (2.4 MB) · provenance.json
```

**Fitting BodyParts3D onto the female body.** A male pelvis does not fit a female one rigidly (hers is wider and shallower). The fit is a similarity transform by Horn's method on the hip bones, sacrum and fifth lumbar vertebra (15.4 mm RMS), refined by ICP of the BodyParts3D hip bones and sacrum onto the HRA ones with the scale kept (14.5 mm surface RMS), then a smooth warp: displacements from the placed bone surface to the nearest HRA bone surface at 1,199 samples, smoothed between neighbours and spread by a Gaussian kernel (σ 16 mm), which brings the surfaces to 4.2 mm RMS. The pelvic floor and iliac arteries move with it and are then pushed out of the HRA organs. The ribs and sternum use a thorax fit on the thoracic vertebrae (4.6 mm).

**Modelled parts.**
- **Endometrium:** a lens in the cavity plane where the two HRA walls meet, an inverted triangle in outline, with a morph for its thickness.
- **Gravid uterus:** an icosphere shrink-wrapped to the real uterus, with a morph to the term shape: lower pole at the internal os, back on the spine, fundus just below the xiphoid. The HRA term placenta set is placed on its inner posterior wall.
- **Vulva:** labia, clitoris, vestibular bulbs and Bartholin's glands placed on the vaginal opening and the pubic arch.
- **Ducts and vessels** (female urethra, ovarian vessels, male urethra parts, ejaculatory ducts, deep arteries): tubes along traced centre lines, rings every 2.5 mm.
- **Corpora cavernosa:** the BodyParts3D pair split at the midline septum.

**Routes.** Centre lines of the real ducts and vessels: egg (ovary → fimbriae → ampulla → uterus), sperm (vagina → cervix → uterus → each tube; testis → epididymis → deferent duct → ejaculatory duct → urethra), hormone and blood routes, milk (lobes → ducts → nipple) and the birth canal (the curve of Carus: inlet → mid-pelvis → outlet).

**Measured and checked.** Organ sizes and volumes (uterus, cervix, tubes, ovaries, vagina, testes, prostate, seminal vesicles, urethra), the pelvic inlet, the term uterus; checks that the cervix lies between bladder and rectum, the uterus above the vagina, the ovaries beside the uterus with the fimbriae near them, the pelvic floor below the uterus, the term fundus below the xiphoid, the lining inside the uterus; the prostate below the bladder, the seminal vesicles behind it, the testes in the scrotum below the symphysis, the ducts reaching the vesicles, the urethra through the prostate; and every route continuous. The extraction fails if any check fails.

## Performance

On an AMD integrated GPU (installed Chrome, D3D11) the static views run at 61 fps. The animated views keep rendering every frame: fertilisation 41, pregnancy 39, birth 33, contraception 25 and sperm 24 fps (instanced sperm and hormone particles over the tissue). The time sliders tick four times a second, the shaders are compiled at load so changing view does not stall, and the lab drops the coat and sheen if frames stay slower than 50 ms.
