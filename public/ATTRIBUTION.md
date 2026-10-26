# Attribution and asset provenance

## 3D models — `models/female.glb` and `models/male.glb`

### Sources

1. **3D Reference Organ Set for Female v1.5 (HuBMAP Human Reference Atlas, united female)**, by **Kristen Browne and Heidi Schlehlein** (and HRA contributors), from the Visible Human Female (National Library of Medicine). DOI https://doi.org/10.48539/HBM352.BTSQ.586. Licensed **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/).
   - Taken as converted by *Female Atlas* (github.com/Niyaz-05/female-atlas, commit `4c2dfcca02739b59827601915128ee64abdff2ea`; its `atlas.json` sha256 `5fec63b2ebcb76ecd9c33027ed725e8ec0a7a76b756f72681285410072ae5c51`). The converter's +0.794760942 m vertical translation is reversed here.
   - It provides the whole female body except the parts listed below: the uterus (fundus, body, cornua, lower segment, anterior and posterior walls), cervix with the internal and external os, uterine tubes (isthmus, ampulla, infundibulum, fimbriae), ovaries, the broad, round, ovarian and suspensory ligaments, vagina, breasts (lobes, ducts, sinuses, nipples, areolae), the full-term placenta set (placenta, umbilical cord and vessels, membranes), bladder, ureters, rectum, the pelvic bones and lumbar spine, and the aorta, vena cava and iliac and uterine vessels.
2. **BodyParts3D 4.0**, © The **Database Center for Life Science** (DBCLS), CC BY 4.0. https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
   - The whole male body: testes, epididymides, deferent ducts, seminal vesicles, prostate, corpus spongiosum and glans, corpus cavernosum, bladder, ureters, rectum, pelvic floor, the aorta, iliac, testicular and penile vessels, lumbar spine, sacrum and hip bones.
   - In the female body: the pelvic floor (levator ani, coccygeus, external anal sphincter), the common, internal and external iliac arteries, the ribs and the sternum, which the HRA set does not include.
   - Taken as converted by *Human Atlas* (github.com/Niyaz-05/human-atlas, commit `76f069640f2c3dd40a58d1556896ac25008f592e`; its `atlas.json` sha256 `c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee`).

Neither HuBMAP nor DBCLS has reviewed or endorsed this lab.

### Modelled parts (not from any scan)

No open scanned model of these parts exists, so they are modelled in `tools/extract-reproductive.mjs` to textbook size around the real structures of each body (Gray's Anatomy, 42nd ed.; Williams Obstetrics, 26th ed.):

- **Endometrium**: a lens in the uterine cavity, between the two HRA walls, with a morph target for its thickness through the cycle (about 1–14 mm).
- **Gravid uterus**: the real uterus wrapped, with a morph target to its term shape (about 34 × 25 × 22 cm, fundus just below the xiphoid). The HRA full-term placenta set is moved onto the inner posterior wall of the term uterus.
- **Vulva**: labia majora and minora, the clitoris (glans, body, crura), vestibular bulbs and greater vestibular (Bartholin's) glands, on the vaginal opening and the pubic arch.
- **Female urethra** (about 4 cm) and **ovarian arteries and veins** (aorta and vena cava or left renal vein → suspensory ligament → ovary).
- **Male**: the scrotum; the prostatic, membranous and spongy parts of the urethra along the BodyParts3D urethra's path; the ejaculatory ducts; the bulbourethral (Cowper's) glands; the BodyParts3D corpus cavernosum split at its septum into left and right; the deep arteries of the penis.

The fetus, follicles, sperm, egg and embryo, hormone particles and the close-ups (a follicle, fertilisation, the early embryo, placental villi, a seminiferous tubule, a milk alveolus) are drawn in code at runtime as illustrations and are not part of the models.

### Changes made (as CC BY 4.0 requires)

`tools/extract-reproductive.mjs`:
- Selected and merged the source meshes listed in `src/repro/source/structures.source.json`; welded coincident vertices; simplified the large meshes with meshoptimizer within the relative error bounds given there (largest error used: 0.99 %); subdivided and smoothed the small parts; recomputed smooth normals.
- Placed the BodyParts3D parts of the female body with similarity transforms (rotation, uniform scale, shift):
  - pelvic floor and iliac arteries: Horn's method on the hip bones, sacrum and fifth lumbar vertebra, refined by iterative closest point of the BodyParts3D hip bones and sacrum onto the HRA ones (14.5 mm surface RMS), then a smooth Gaussian warp of the remaining bone-surface displacements (1,199 samples; 4.2 mm surface RMS after the warp), because a male pelvis does not fit a female one rigidly;
  - ribs and sternum on the thoracic vertebrae: 4.6 mm RMS.
- Pushed the placed pelvic floor out of the HRA organs it overlapped.
- Generated the modelled parts above; measured the organs; checked the body layout; and traced the routes (egg and sperm, the hormone and blood routes, milk, the birth canal along the curve of Carus) through the centre lines of the real ducts and vessels.
- Translated each body so that the middle of its pelvic organs is the origin.

`tools/bake-shading.mjs` then adds a per-vertex `_TISSUE` attribute to each model: ambient occlusion and a noise value, for the real-tissue look.

The outputs:
- `models/female.glb` (6,058,044 bytes, 288,828 triangles, sha256 `38c00ebb314061643c8dd19a6a923c9ba1eb25aacd98359c766640ed050c9937`);
- `models/male.glb` (2,376,876 bytes, 116,078 triangles, sha256 `a41c18f4d3274b284fd929c10c5795e4aeb80ec8a7c2b585dd05d4bec9b72eb0`).

Every input hash is in `src/repro/generated/provenance.json`.

### Scientific sources for the simulations

- Anatomy and physiology text: OpenStax *Anatomy and Physiology 2e*, ch. 27–28, CC BY 4.0; Gray's Anatomy, 42nd ed.; Moore KL et al. *The Developing Human*, 11th ed.
- Menstrual cycle: Hall JE, Hall ME. *Guyton and Hall Textbook of Medical Physiology*, 14th ed., ch. 82; Taylor HS et al. *Speroff's Clinical Gynecologic Endocrinology and Infertility*, 9th ed.; Hoff JD et al. *J Clin Endocrinol Metab* 1983;57:792–796.
- Fertilisation: Wilcox AJ et al. *N Engl J Med* 1995;333:1517–1521; Suarez SS, Pacey AA. *Hum Reprod Update* 2006;12:23–37.
- Pregnancy: Robinson HP, Fleming JE. *Br J Obstet Gynaecol* 1975;82:702–710; Hadlock FP et al. *Radiology* 1991;181:129–133; Cunningham FG et al. *Williams Obstetrics*, 26th ed.; NICE NG201.
- Labour: Zhang J et al. *Obstet Gynecol* 2010;116:1281–1287 (doi 10.1097/AOG.0b013e3181fdef6e); Caldeyro-Barcia R (Montevideo units).
- Spermatogenesis and semen: Heller CG, Clermont Y. *Science* 1963;140:184–186; WHO Laboratory Manual for the Examination and Processing of Human Semen, 6th ed., 2021.
- Contraception: Trussell J. *Contraception* 2011;83:397–404; CDC US Medical Eligibility Criteria 2024; FSRH guidance.
- Disorders: International evidence-based guideline for PCOS, 2023; NICE CG156 (fertility), NG23 (menopause); RCOG Green-top 21 (ectopic pregnancy); NHS screening programmes.
