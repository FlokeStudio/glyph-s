let ortSession = null;
let ortLoadError = null;

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function loadOrtSession(modelPath) {
  if (ortSession) return ortSession;
  if (ortLoadError) return null;
  try {
    const ort = await import('onnxruntime-node');
    ortSession = await ort.InferenceSession.create(modelPath);
    return ortSession;
  } catch (err) {
    ortLoadError = err;
    return null;
  }
}

async function embedWithOnnx(texts, modelPath) {
  const session = await loadOrtSession(modelPath);
  if (!session) return null;
  const ort = await import('onnxruntime-node');
  const out = [];
  for (const text of texts) {
    const input = new ort.Tensor('string', [String(text || '')], [1]);
    const feeds = { [session.inputNames[0]]: input };
    const result = await session.run(feeds);
    const key = session.outputNames[0];
    const tensor = result[key];
    const data = tensor?.data ?? tensor?.cpuData;
    if (!data) continue;
    out.push(data instanceof Float32Array ? data : Float32Array.from(data));
  }
  return out.length ? out : null;
}

export async function embedTexts(texts, opts = {}) {
  const enabled = opts.enabled === true || opts.semanticEmbeddings === true;
  if (!enabled || !Array.isArray(texts) || !texts.length) return null;

  const modelPath = opts.modelPath || opts.embeddingModelPath;
  if (modelPath) {
    try {
      const vectors = await embedWithOnnx(texts, modelPath);
      if (vectors) return vectors;
    } catch {
      /* fall through to hash fallback */
    }
  }

  return texts.map((text) => hashEmbed(String(text || '')));
}

function hashEmbed(text) {
  const dim = 64;
  const vec = new Float32Array(dim);
  const low = text.toLowerCase();
  for (let i = 0; i < low.length; i++) {
    const code = low.charCodeAt(i);
    vec[code % dim] += 1;
    vec[(code * 7 + i) % dim] += 0.5;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vec[i] /= norm;
  return vec;
}

export function embedTextSync(text) {
  return hashEmbed(String(text || ''));
}

export function embeddingBoost(queryVector, itemVector, weight = 12) {
  if (!queryVector || !itemVector) return 0;
  const q = queryVector instanceof Float32Array ? queryVector : Float32Array.from(queryVector);
  const it = itemVector instanceof Float32Array ? itemVector : Float32Array.from(itemVector);
  const sim = cosineSimilarity(q, it);
  if (sim <= 0.05) return 0;
  return Math.round(sim * weight);
}
