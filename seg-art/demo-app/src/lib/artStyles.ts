export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  promptEnhancements: {
    prefix: string;
    suffix: string;
    negativePrompt: string;
  };
  technicalSpecs: {
    guidance_scale: number;
    num_inference_steps: number;
    strength?: number;
  };
  qualityModifiers: string[];
}

export const ART_STYLES: Record<string, ArtStyle> = {
  realistic: {
    id: 'realistic',
    name: 'Realistic/Photorealistic',
    description: 'Lifelike renders with accurate materials, lighting, and true-to-life proportions',
    characteristics: [
      'photorealistic rendering',
      'accurate material properties',
      'realistic lighting and shadows',
      'true-to-life proportions',
      'detailed surface textures',
      'proper subsurface scattering',
      'accurate color reproduction',
      'natural depth of field'
    ],
    promptEnhancements: {
      prefix: 'Photorealistic, ultra-detailed, professional concept art, anatomically correct facial features with natural skin textures, realistic lighting and proper shadowing, accurate human body proportions following real-world anatomy, intricate jewelry and ornament details with material properties,',
      suffix: ', sharp precise form definition, fine surface textures and wear patterns, proper three-dimensional lighting and depth, consistent perspective and scale, photorealistic rendering, detailed textures, sharp focus, professional quality, masterpiece',
      negativePrompt: 'cartoon, anime, stylized, painted, sketch, drawing, illustration, unrealistic, fake, artificial, low quality, blurry, distorted, nude, naked, semi-nude, undressed, revealing, inappropriate, sexual, adult content, nsfw'
    },
    ornamentalEnhancements: {
      prefix: 'Ornamental frame in polished 18k gold, carved filigree, sharp bevels, sparkling gemstones with crisp facets, realistic reflections,',
      negativePrompt: 'blurry, soft edges, melted metal, fuzzy ornaments'
    },
    technicalSpecs: {
      guidance_scale: 12.0,
      num_inference_steps: 100,
      strength: 0.8
    },
    qualityModifiers: [
      'museum-quality concept art',
      'professional production standards',
      'anatomically correct proportions',
      'photographic realism and accuracy',
      'intricate believable material details',
      'sharp precise form definition',
      'three-dimensional lighting and depth',
      'naturalistic representation quality',
      'production-ready reference value',
      'high resolution component clarity'
    ]
  },

  anime: {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style with clean lines, expressive features, and stylized proportions',
    characteristics: [
      'clean vector-like line art',
      'expressive large eyes',
      'stylized proportions',
      'cel-shading technique',
      'vibrant color palette',
      'smooth gradients',
      'minimal realistic textures',
      'characteristic anime lighting'
    ],
    promptEnhancements: {
      prefix: 'Anime style, Japanese animation, clean line art, cel-shaded,',
      suffix: ', anime artwork, manga style, clean lines, vibrant colors, expressive features, professional anime production quality, studio anime style',
      negativePrompt: 'realistic, photographic, western cartoon, rough lines, sketchy, messy, realistic proportions, photorealistic'
    },
    ornamentalEnhancements: {
      prefix: 'Anime-style ornamental frame, clean lineart, cel-shaded gems, bold gold edges, crisp decorative shapes,',
      negativePrompt: 'blurry, fuzzy lines, painterly smudge'
    },
    technicalSpecs: {
      guidance_scale: 10.0,
      num_inference_steps: 60,
      strength: 0.75
    },
    qualityModifiers: [
      'studio anime quality',
      'clean vector lines',
      'perfect cel-shading',
      'vibrant anime colors',
      'expressive character design',
      'professional animation style'
    ]
  },

  comic: {
    id: 'comic',
    name: 'Comic/Cartoon',
    description: 'Bold outlines with dynamic poses, clear cel-shading, and comic-style texturing',
    characteristics: [
      'bold black outlines',
      'dynamic action poses',
      'clear cel-shading',
      'comic book coloring',
      'exaggerated expressions',
      'stylized anatomy',
      'pop art influences',
      'high contrast lighting'
    ],
    promptEnhancements: {
      prefix: 'Comic book style, cartoon illustration, bold outlines, cel-shaded,',
      suffix: ', comic book art, graphic novel style, bold lines, dynamic pose, vibrant comic colors, professional comic book illustration, pop art style',
      negativePrompt: 'realistic, photographic, soft lines, blended shading, muted colors, realistic anatomy, photorealistic'
    },
    ornamentalEnhancements: {
      prefix: 'Bold ornamental frame, cartoon-like style, clean thick outlines, sharp gold filigree, bright jewel highlights, clear edges,',
      negativePrompt: 'blurry, fuzzy edges, melted ornaments, smudged textures'
    },
    technicalSpecs: {
      guidance_scale: 11.0,
      num_inference_steps: 50,
      strength: 0.7
    },
    qualityModifiers: [
      'professional comic book quality',
      'bold graphic design',
      'dynamic composition',
      'high contrast colors',
      'clear line definition',
      'comic book printing style'
    ]
  },

  watercolor: {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft edges, translucent color layers, and natural pigment bleeding effects',
    characteristics: [
      'soft watercolor edges',
      'translucent color layers',
      'natural pigment bleeding',
      'paper texture visible',
      'organic color flow',
      'subtle color gradients',
      'traditional painting feel',
      'delicate brush strokes'
    ],
    promptEnhancements: {
      prefix: 'Watercolor painting, soft edges, translucent layers, traditional watercolor technique,',
      suffix: ', watercolor artwork, soft brushstrokes, natural pigment flow, paper texture, delicate colors, traditional painting, artistic watercolor style',
      negativePrompt: 'digital art, sharp edges, solid colors, vector art, photographic, realistic, hard lines, digital painting'
    },
    ornamentalEnhancements: {
      prefix: 'Watercolor ornamental design, soft painted edges, translucent gold washes, delicate gem colors, flowing decorative elements,',
      negativePrompt: 'sharp edges, solid colors, digital ornaments, harsh lines'
    },
    technicalSpecs: {
      guidance_scale: 8.0,
      num_inference_steps: 70,
      strength: 0.85
    },
    qualityModifiers: [
      'traditional watercolor technique',
      'natural pigment behavior',
      'paper texture integration',
      'soft color transitions',
      'organic brush flow',
      'artistic painting quality'
    ]
  },

  oil_painting: {
    id: 'oil_painting',
    name: 'Oil Painting',
    description: 'Rich textures with visible brushstrokes, layered depth, and classical painting techniques',
    characteristics: [
      'visible brush strokes',
      'rich oil paint texture',
      'layered paint application',
      'classical painting technique',
      'deep color saturation',
      'traditional canvas texture',
      'masterful light and shadow',
      'painterly quality'
    ],
    promptEnhancements: {
      prefix: 'Oil painting, classical painting technique, visible brushstrokes, rich textures,',
      suffix: ', traditional oil painting, masterpiece painting, classical art style, rich colors, painterly technique, fine art quality, museum piece',
      negativePrompt: 'digital art, smooth surfaces, vector art, flat colors, modern style, photographic, clean lines, digital painting'
    },
    ornamentalEnhancements: {
      prefix: 'Oil painted ornamental frame, rich brushstrokes, layered gold paint, textured gem details, classical decorative style,',
      negativePrompt: 'digital art, smooth surfaces, flat ornaments, vector style'
    },
    technicalSpecs: {
      guidance_scale: 9.0,
      num_inference_steps: 90,
      strength: 0.9
    },
    qualityModifiers: [
      'classical painting mastery',
      'rich oil paint texture',
      'traditional canvas surface',
      'masterful brushwork',
      'deep color richness',
      'fine art museum quality'
    ]
  },

  digital_art: {
    id: 'digital_art',
    name: 'Digital Art',
    description: 'Modern crisp edges with professional post-processing and contemporary digital techniques',
    characteristics: [
      'crisp digital edges',
      'modern color grading',
      'professional post-processing',
      'clean digital rendering',
      'contemporary style',
      'perfect pixel precision',
      'advanced digital techniques',
      'high-tech aesthetic'
    ],
    promptEnhancements: {
      prefix: 'Digital art, modern digital painting, crisp edges, professional digital artwork,',
      suffix: ', contemporary digital art, clean digital rendering, modern style, professional digital illustration, high-tech aesthetic, perfect digital quality',
      negativePrompt: 'traditional painting, rough textures, hand-painted, analog, vintage, old-fashioned, sketchy, unfinished'
    },
    ornamentalEnhancements: {
      prefix: 'Digital art ornamental frame, vibrant colors, crisp polished gold, glowing jewels with sharp highlights,',
      negativePrompt: 'blurry, noisy textures, fuzzy ornaments'
    },
    technicalSpecs: {
      guidance_scale: 11.0,
      num_inference_steps: 60,
      strength: 0.75
    },
    qualityModifiers: [
      'professional digital quality',
      'crisp pixel-perfect edges',
      'modern color science',
      'advanced digital techniques',
      'contemporary aesthetic',
      'high-resolution clarity'
    ]
  },

  fantasy: {
    id: 'fantasy',
    name: 'Fantasy Art',
    description: 'Magical and ethereal elements with otherworldly atmosphere and mystical qualities',
    characteristics: [
      'magical ethereal atmosphere',
      'otherworldly elements',
      'mystical lighting effects',
      'fantasy creature design',
      'enchanted environments',
      'supernatural phenomena',
      'epic fantasy scale',
      'mythological themes'
    ],
    promptEnhancements: {
      prefix: 'Fantasy art, magical atmosphere, ethereal lighting, mystical elements,',
      suffix: ', epic fantasy artwork, magical realism, otherworldly beauty, enchanted atmosphere, mystical quality, fantasy masterpiece, legendary art style',
      negativePrompt: 'mundane, ordinary, realistic, everyday, modern, technological, scientific, plain, simple, boring'
    },
    ornamentalEnhancements: {
      prefix: 'Fantasy ornamental frame, glowing runes carved into sharp gold filigree, magical gemstones, crisp and detailed edges,',
      negativePrompt: 'blur, glow blur, melted edges, unclear ornaments'
    },
    technicalSpecs: {
      guidance_scale: 13.0,
      num_inference_steps: 80,
      strength: 0.85
    },
    qualityModifiers: [
      'epic fantasy quality',
      'magical atmosphere',
      'ethereal lighting effects',
      'mystical color palette',
      'otherworldly beauty',
      'legendary artwork standard'
    ]
  },

  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple designs focusing on essential elements with elegant simplicity',
    characteristics: [
      'clean simple design',
      'essential elements only',
      'elegant simplicity',
      'minimal color palette',
      'geometric precision',
      'negative space usage',
      'refined aesthetics',
      'sophisticated restraint'
    ],
    promptEnhancements: {
      prefix: 'Minimalist design, clean simple style, elegant simplicity, essential elements,',
      suffix: ', minimalist artwork, clean design, sophisticated simplicity, refined aesthetics, elegant minimalism, modern minimalist style',
      negativePrompt: 'cluttered, busy, complex, ornate, detailed, decorative, elaborate, excessive, overwhelming, chaotic'
    },
    ornamentalEnhancements: {
      prefix: 'Minimalist ornamental design, simple sharp geometry, clean golden edges, clear jewel accents,',
      negativePrompt: 'cluttered, fuzzy edges, over-detailed smudge'
    },
    technicalSpecs: {
      guidance_scale: 9.0,
      num_inference_steps: 30,
      strength: 0.5
    },
    qualityModifiers: [
      'sophisticated minimalism',
      'elegant simplicity',
      'clean design principles',
      'refined aesthetic',
      'modern minimalist quality'
    ]
  },

  hand_drawn: {
    id: 'hand_drawn',
    name: 'Training/Reference Style',
    description: 'Anatomy study with detailed sketch showing correct proportions',
    characteristics: [
      'anatomy study',
      'detailed sketch of human body',
      'correct proportions',
      'bone and muscle structure visible',
      'clean educational drawing'
    ],
    promptEnhancements: {
      prefix: 'Anatomy study, detailed sketch of human body, correct proportions, bone and muscle structure visible, clean educational drawing,',
      suffix: ', educational illustration, anatomical reference, study drawing, clear line work, instructional quality',
      negativePrompt: 'distorted anatomy, incorrect proportions, messy lines, unclear structure, poor anatomy'
    },
    ornamentalEnhancements: {
      prefix: 'Hand-drawn ornamental design, visible strokes but crisp edges, clean decorative filigree, sharp contours,',
      negativePrompt: 'blurry, smudged strokes, fuzzy lines'
    },
    technicalSpecs: {
      guidance_scale: 10.0,
      num_inference_steps: 60,
      strength: 0.75
    },
    qualityModifiers: [
      'educational quality',
      'anatomical accuracy',
      'clear instructional style',
      'reference drawing standard',
      'study illustration quality'
    ]
  },

  stylized: {
    id: 'stylized',
    name: 'Stylized',
    description: 'Exaggerated, cartoon-like style with bold shapes and colors',
    characteristics: [
      'bold stylized shapes',
      'exaggerated proportions',
      'cartoon-like rendering',
      'vibrant color palette',
      'clean graphic style',
      'simplified forms',
      'artistic interpretation',
      'non-realistic approach'
    ],
    promptEnhancements: {
      prefix: 'Stylized art, cartoon-like style, bold shapes, exaggerated proportions,',
      suffix: ', stylized artwork, graphic design style, bold colors, clean shapes, artistic interpretation, professional stylized quality',
      negativePrompt: 'realistic, photographic, detailed anatomy, complex textures, photorealistic'
    },
    ornamentalEnhancements: {
      prefix: 'Bold ornamental frame, cartoon-like style, clean thick outlines, sharp gold filigree, bright jewel highlights, clear edges,',
      negativePrompt: 'blurry, fuzzy edges, melted ornaments, smudged textures'
    },
    technicalSpecs: {
      guidance_scale: 10.0,
      num_inference_steps: 50,
      strength: 0.7
    },
    qualityModifiers: [
      'professional stylized quality',
      'bold graphic design',
      'clean artistic style',
      'vibrant color scheme',
      'simplified elegance'
    ]
  },

  semi_realistic: {
    id: 'semi_realistic',
    name: 'Semi-Realistic',
    description: 'Balanced blend of realism and artistic interpretation',
    characteristics: [
      'balanced realism',
      'artistic interpretation',
      'stylized realism',
      'enhanced details',
      'artistic lighting',
      'refined proportions',
      'polished finish',
      'professional quality'
    ],
    promptEnhancements: {
      prefix: 'Semi-realistic art, balanced realism with artistic interpretation, stylized details,',
      suffix: ', semi-realistic artwork, polished style, artistic realism, professional quality, refined details',
      negativePrompt: 'overly realistic, photographic, cartoon, too stylized, amateur quality'
    },
    ornamentalEnhancements: {
      prefix: 'Ornamental design with polished metal, clear primary shapes, sharp gem details, slight artistic softness but crisp edges,',
      negativePrompt: 'blurry, smudged details, fuzzy lines'
    },
    technicalSpecs: {
      guidance_scale: 11.0,
      num_inference_steps: 70,
      strength: 0.75
    },
    qualityModifiers: [
      'balanced artistic realism',
      'polished professional quality',
      'refined artistic details',
      'stylized realism approach'
    ]
  },

  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Vintage-inspired style with classic gaming aesthetics',
    characteristics: [
      'vintage aesthetics',
      'retro color palette',
      'classic design elements',
      'nostalgic feel',
      'period-appropriate style',
      'vintage textures',
      'classic proportions',
      'timeless appeal'
    ],
    promptEnhancements: {
      prefix: 'Retro style, vintage aesthetics, classic design elements, nostalgic feel,',
      suffix: ', retro artwork, vintage style, classic aesthetics, period design, nostalgic quality, timeless appeal',
      negativePrompt: 'modern, contemporary, futuristic, high-tech, digital, current trends'
    },
    ornamentalEnhancements: {
      prefix: 'Retro ornamental slot frame, chrome-like edges, sharp highlight sweep, jewel-like details, clear bevels,',
      negativePrompt: 'blurry, melted metal, unclear ornaments'
    },
    technicalSpecs: {
      guidance_scale: 10.0,
      num_inference_steps: 60,
      strength: 0.75
    },
    qualityModifiers: [
      'authentic vintage quality',
      'classic design principles',
      'nostalgic appeal',
      'period-appropriate style'
    ]
  },

  '3d_rendered': {
    id: '3d_rendered',
    name: '3D Rendered',
    description: 'Three-dimensional style with depth and lighting',
    characteristics: [
      '3D rendered appearance',
      'dimensional depth',
      'realistic lighting',
      'material properties',
      'volumetric rendering',
      'surface details',
      'shadow casting',
      'professional 3D quality'
    ],
    promptEnhancements: {
      prefix: '3D rendered, three-dimensional appearance, volumetric lighting, realistic materials,',
      suffix: ', 3D artwork, rendered quality, dimensional depth, professional 3D rendering, realistic lighting, material properties',
      negativePrompt: 'flat, 2D, painted, sketchy, hand-drawn, cartoon, unrealistic lighting'
    },
    ornamentalEnhancements: {
      prefix: '3D rendered ornamental frame, polished metallic reflections, sharp bevels, crisp gems, realistic lighting,',
      negativePrompt: 'blur, melted edges, fuzzy ornaments, flat shading'
    },
    technicalSpecs: {
      guidance_scale: 12.0,
      num_inference_steps: 80,
      strength: 0.8
    },
    qualityModifiers: [
      'professional 3D rendering',
      'realistic material properties',
      'accurate lighting simulation',
      'dimensional depth quality'
    ]
  },

  chinese_art: {
    id: 'chinese_art',
    name: 'Chinese Art',
    description: 'Traditional ink wash rendering with dynamic brush strokes and layered transparency',
    characteristics: [
      'traditional ink wash rendering',
      'dynamic brush stroke technique',
      'layered transparency effects',
      'controlled ink diffusion',
      'precise line work',
      'balanced negative space',
      'traditional color harmony'
    ],
    promptEnhancements: {
      prefix: 'Traditional Chinese art, ink wash painting, dynamic brush strokes, layered transparency,',
      suffix: ', Chinese artwork, traditional painting style, ink wash technique, brush painting, classical Chinese art, cultural authenticity',
      negativePrompt: 'western style, digital art, photographic, modern techniques, non-traditional'
    },
    ornamentalEnhancements: {
      prefix: 'Traditional Chinese ornamental design, cloud-like scrolls with crisp ink edges, gold accents, sharp brush strokes,',
      negativePrompt: 'blurry ink, smudged ornaments, fuzzy scrolls'
    },
    technicalSpecs: {
      guidance_scale: 10.0,
      num_inference_steps: 100,
      strength: 0.8
    },
    qualityModifiers: [
      'traditional Chinese art quality',
      'authentic ink wash technique',
      'cultural artistic accuracy',
      'classical painting mastery'
    ]
  },

  custom_slotart: {
    id: 'custom_slotart',
    name: 'Custom SlotArt',
    description: 'Premium slot game style with ornate metallic frames, gem-like finishes, and decorative flourishes',
    characteristics: [
      'ultra-detailed digital painting with volumetric lighting',
      'dramatic dual-tone lighting effects',
      'iridescent color transitions',
      'ornate metallic jewelry and accessories',
      'ethereal atmospheric glow',
      'intricate fabric textures',
      'delicate ornamental details',
      'premium gemstone accents',
      'perfect symmetry with flowing elements',
      'rich color harmonies with purple and gold'
    ],
    dragonStyle: {
      name: 'Dragon Art Style',
      description: 'Majestic Chinese dragon with golden scales, flowing mane, and ornate details',
      basePrompt: 'Majestic Chinese dragon with lustrous golden scales, flowing fiery mane in red and orange gradients, ornate traditional details, powerful muscular form, intricate scale patterns, flowing whiskers and horns, dramatic pose, rich golden and crimson color palette, traditional Chinese artistic elements, premium slot game quality, ultra-detailed digital painting, volumetric lighting, crystal-clear edges, perfect anatomy, masterpiece quality',
      angles: {
        'front-view': 'dragon facing forward, head-on view, symmetrical composition, direct eye contact, powerful frontal presence',
        'profile-left': 'dragon in left profile view, side silhouette, elegant S-curve body, flowing mane visible',
        'profile-right': 'dragon in right profile view, side silhouette, graceful serpentine form, detailed scale texture',
        'three-quarter-left': 'dragon at three-quarter left angle, dynamic perspective, showing depth and dimension',
        'three-quarter-right': 'dragon at three-quarter right angle, dramatic perspective, powerful stance',
        'ascending': 'dragon rising upward, ascending pose, wings spread, majestic upward movement',
        'descending': 'dragon descending downward, diving pose, powerful downward motion, flowing mane trailing',
        'coiled': 'dragon in coiled position, circular composition, serpentine body wrapped, traditional pose',
        'flying': 'dragon in flight, wings extended, soaring through clouds, dynamic aerial pose',
        'rearing': 'dragon rearing up, front claws raised, powerful intimidating stance, head held high',
        'swimming': 'dragon swimming through water or clouds, fluid motion, graceful aquatic movement',
        'guardian': 'dragon in protective guardian pose, watchful stance, noble bearing, ceremonial position'
      },
      negativePrompt: 'blurry, low quality, soft edges, poor anatomy, bad anatomy, anatomical errors, incorrect proportions, malformed, disfigured, distorted, deformed, ugly, amateur work, unprofessional, pixelated, jpeg artifacts, compression artifacts, low resolution, noisy, grainy, out of focus, motion blur, depth of field, background elements, western dragon, european dragon, wings, feathered wings, bat wings, fire breathing, dark colors, black scales, evil appearance, aggressive expression, nude, naked, semi-nude, undressed, revealing, inappropriate, sexual, adult content, nsfw, explicit'
    },
    materials: {
      primary: {
        finish: 'iridescent metallic sheen with dual-tone lighting',
        effects: 'volumetric rim lighting with color transitions',
        details: 'ornate jewelry patterns with gemstone accents',
        layers: [
          'base material layer with atmospheric glow',
          'iridescent metallic finish',
          'ornamental jewelry details',
          'volumetric lighting effects',
          'gemstone highlight layer',
          'atmospheric bloom layer'
        ]
      },
      secondary: {
        finish: 'polished chrome with rainbow reflections',
        effects: 'prismatic light dispersion',
        details: 'intricate filigree work with crystal inlays',
        layers: [
          'reflective chrome base',
          'prismatic overlay effects',
          'crystal detail layer',
          'rainbow reflection highlights'
        ]
      }
    },
    promptEnhancements: {
      prefix: 'Premium slot game art style, ultra-detailed digital painting, ornate metallic frame with gemstone inlays, iridescent finish, volumetric lighting,',
      suffix: ', premium slot machine quality, ornate decorative elements, gemstone accents, metallic sheen, professional game art, masterpiece quality, crystal-clear details',
      negativePrompt: 'low quality, blurry, amateur, simple, plain, dull colors, flat lighting, poor details, unprofessional'
    },
    ornamentalEnhancements: {
      prefix: 'Premium slot machine ornamental frame, ornate gold filigree, sharp bevels, gemstone inlays sparkling with crisp facets, jewel-like polish,',
      negativePrompt: 'blurry, fuzzy edges, smudged details, melted ornaments'
    },
    technicalSpecs: {
      guidance_scale: 12.0,
      num_inference_steps: 80,
      strength: 0.85
    },
    qualityModifiers: [
      'premium slot game quality',
      'ornate decorative style',
      'gemstone luxury finish',
      'professional game art standard',
      'ultra-detailed craftsmanship'
    ]
  }
}

// Function to enhance prompts with style-specific improvements
export function enhancePromptWithStyle(basePrompt: string, styleId: string, hasOrnaments: boolean = false): {
  enhancedPrompt: string;
  negativePrompt: string;
  technicalSpecs: ArtStyle['technicalSpecs'];
} {
  const style = ART_STYLES[styleId];
  
  if (!style) {
    throw new Error(`Unknown art style: ${styleId}`);
  }

  let enhancedPrompt: string;
  let negativePrompt: string;

  if (hasOrnaments && style.ornamentalEnhancements) {
    // Use ornamental-specific enhancements
    enhancedPrompt = `${style.ornamentalEnhancements.prefix} ${basePrompt} ${style.promptEnhancements.suffix}`;
    negativePrompt = `${style.promptEnhancements.negativePrompt}, ${style.ornamentalEnhancements.negativePrompt}`;
  } else {
    // Use regular style enhancements
    enhancedPrompt = `${style.promptEnhancements.prefix} ${basePrompt} ${style.promptEnhancements.suffix}`;
    negativePrompt = style.promptEnhancements.negativePrompt;
  }
  
  return {
    enhancedPrompt,
    negativePrompt,
    technicalSpecs: style.technicalSpecs
  };
}

// Function to get style characteristics for UI display
export function getStyleCharacteristics(styleId: string): string[] {
  const style = ART_STYLES[styleId];
  return style ? style.characteristics : [];
}

// Function to get all available styles for selection
export function getAllStyles(): ArtStyle[] {
  // Get built-in styles
  const builtInStyles = Object.values(ART_STYLES);
  
  // Get custom styles from localStorage
  const customStyles = JSON.parse(localStorage.getItem('customArtStyles') || '[]');
  
  // Convert custom styles to ArtStyle format
  const formattedCustomStyles = customStyles.map((style: any) => ({
    id: `custom-${style.id}`,
    name: style.name,
    description: style.description,
    characteristics: style.characteristics || [],
    promptEnhancements: {
      prefix: style.prompt || style.prefix || '',
      suffix: style.suffix || ', high quality, detailed artwork, masterpiece',
      negativePrompt: style.negativePrompt || 'low quality, blurry, distorted, deformed, ugly, bad anatomy'
    },
    ornamentalEnhancements: {
      prefix: 'Premium slot machine ornamental frame, ornate gold filigree, sharp bevels, gemstone inlays sparkling with crisp facets, jewel-like polish,',
      negativePrompt: 'blurry, fuzzy edges, smudged details, melted ornaments'
    },
    technicalSpecs: style.technicalSpecs || {
      guidance_scale: 10.0,
      num_inference_steps: 60,
      strength: 0.8
    },
    qualityModifiers: [
      'custom style quality',
      'reference-based rendering',
      'style consistency',
      'artistic interpretation'
    ]
  }));
  
  return [...builtInStyles, ...formattedCustomStyles];
}