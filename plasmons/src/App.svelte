<main class="stack">
  <h1>Plasmon Curves</h1>

  <div class="with-sidebar" style="--sidebar-width: 30rem">
    <section class="stack" aria-labelledby="layers-heading" style="--stack-space: var(--space-xs)">
      <h2 id="layers-heading">Layers</h2>

      <fieldset>
        <legend>Cytosol</legend>
        <label>
          Refractive index
          <input type="range" name="cytosol-ri" min="1.34" max="1.40" step="0.001" value="1.37" />
          <output for="cytosol-ri">1.370</output>
        </label>
        <p>Thickness: ∞</p>
      </fieldset>

      <fieldset>
        <legend>Membrane</legend>
        <p>Refractive index: 1.5000</p>
        <p>Thickness: 8 nm</p>
      </fieldset>

      <fieldset>
        <legend>Media</legend>
        <p>Refractive index: 1.3350</p>
        <label>
          Thickness (nm)
          <input type="range" name="media-thickness" min="0" max="150" step="1" value="50" />
          <output for="media-thickness">50</output>
        </label>
      </fieldset>

      <fieldset>
        <legend>Gold</legend>
        <p>Refractive index: 0.1943 + 3.5921i</p>
        <label>
          Thickness (nm)
          <input type="range" name="gold-thickness" min="38" max="55" step="0.5" value="47" />
          <output for="gold-thickness">47</output>
        </label>
      </fieldset>

      <fieldset>
        <legend>Chromium</legend>
        <p>Refractive index: 3.3000 + 4.2731i</p>
        <label>
          Thickness (nm)
          <input type="range" name="chromium-thickness" min="2" max="5" step="0.1" value="3" />
          <output for="chromium-thickness">3</output>
        </label>
      </fieldset>

      <fieldset>
        <legend>Coverslip</legend>
        <p>Refractive index: 1.7880</p>
        <p>Thickness: ∞</p>
      </fieldset>
    </section>

    <section class="stack" aria-labelledby="curve-heading" style="--stack-space: var(--space-s)">
      <h2 id="curve-heading">Curve</h2>

      <svg viewBox="0 0 600 400" role="img" aria-labelledby="curve-title">
        <title id="curve-title">Reflectance against angle of incidence</title>

        <!-- axes -->
        <line x1="60" y1="20" x2="60" y2="340" stroke="currentColor" />
        <line x1="60" y1="340" x2="580" y2="340" stroke="currentColor" />

        <!-- axis labels -->
        <text x="320" y="385" text-anchor="middle" font-size="16">Angle of incidence (°)</text>
        <text x="20" y="180" text-anchor="middle" font-size="16" transform="rotate(-90 20 180)">Reflectance</text>

        <!-- curve (placeholder) -->
        <path d="M 60 40 C 300 40, 320 300, 360 300 S 420 60, 580 60" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
    </section>
  </div>
</main>

<style>
  main {
    padding: var(--space-m);
  }

  svg {
    inline-size: 100%;
    block-size: auto;
  }

  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
  }

  input[type="range"] {
    flex: 1 1 6rem;
    min-inline-size: 0;
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs) var(--space-s);

    > * {
      flex: 1 1 8rem;
    }

    p {
      margin: 0;
    }
  }
</style>
