<script lang="ts">
  import * as pdfjsLib from "pdfjs-dist";
  import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  interface Props {
    file: string;
  }

  let { file }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state(undefined);
  let annotationDiv: HTMLDivElement | undefined = $state(undefined);
  let pdf: pdfjsLib.PDFDocumentProxy | null = $state(null);
  let pageNum = $state(1);
  let numPages = $state(0);
  let renderTask: { cancel(): void; promise: Promise<void> } | null = null;
  let touchStartX = 0;

  $effect(() => {
    const url = `slides/${encodeURIComponent(file)}`;
    pdfjsLib.getDocument(url).promise.then((doc) => {
      pdf = doc;
      numPages = doc.numPages;
    });
  });

  async function renderPage() {
    if (!pdf || !canvas) return;
    const doc = pdf;
    const num = pageNum;
    const cvs = canvas;

    renderTask?.cancel();
    const page = await doc.getPage(num);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = Math.min(
      window.innerWidth / vp0.width,
      window.innerHeight / vp0.height
    );
    const vp = page.getViewport({ scale });
    cvs.width = Math.floor(vp.width);
    cvs.height = Math.floor(vp.height);
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    renderTask = page.render({ canvasContext: ctx, viewport: vp });
    try {
      await renderTask.promise;
    } catch {
      // render was cancelled — ignore
      return;
    }

    renderAnnotations(page, vp);
  }

  async function renderAnnotations(
    page: pdfjsLib.PDFPageProxy,
    vp: pdfjsLib.PageViewport
  ) {
    if (!annotationDiv) return;
    const div = annotationDiv;
    const annotations = await page.getAnnotations();
    div.innerHTML = "";
    div.style.width = `${vp.width}px`;
    div.style.height = `${vp.height}px`;

    for (const ann of annotations as Array<Record<string, unknown>>) {
      if (ann["subtype"] !== "Link") continue;
      const url = (ann["url"] ?? ann["unsafeUrl"]) as string | undefined;
      if (!url) continue;
      const [x1, y1, x2, y2] = vp.convertToViewportRectangle(
        ann["rect"] as [number, number, number, number]
      );
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.cssText = `position:absolute;left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.abs(x2-x1)}px;height:${Math.abs(y2-y1)}px`;
      div.appendChild(a);
    }
  }

  $effect(() => {
    renderPage();
  });

  $effect(() => {
    function onResize() {
      renderPage();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  function next() {
    if (pageNum < numPages) pageNum++;
  }

  function prev() {
    if (pageNum > 1) pageNum--;
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        prev();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "Escape":
        if (document.fullscreenElement) document.exitFullscreen();
        break;
    }
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next(); else prev();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="presenter" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
  {#if pdf}
    <div class="slide-wrapper">
      <canvas bind:this={canvas}></canvas>
      <div class="annotation-layer" bind:this={annotationDiv}></div>
    </div>
    <div class="counter">{pageNum} / {numPages}</div>
    <a class="back" href="./">← Back</a>
  {:else}
    <p class="loading">Loading…</p>
  {/if}
</div>

<style>
  .presenter {
    position: fixed;
    inset: 0;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .slide-wrapper {
    position: relative;
    line-height: 0;
  }

  canvas {
    display: block;
  }

  .annotation-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .annotation-layer :global(a) {
    display: block;
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
  }

  .counter {
    position: absolute;
    bottom: var(--space-s);
    right: var(--space-s);
    color: rgba(255, 255, 255, 0.4);
    font-size: var(--step--2);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }

  .back {
    position: absolute;
    top: var(--space-s);
    left: var(--space-s);
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    font-size: var(--step--1);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .presenter:hover .back {
    opacity: 1;
  }

  .loading {
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }
</style>
