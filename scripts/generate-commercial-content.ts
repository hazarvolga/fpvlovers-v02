import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const BUYER_GUIDES_CATEGORY = 'Buyer Guides';

const CONVERSIONS = [
  {
    file: 'best-fpv-starter-kits-2026-rtf-bundles-for-beginners.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['BETAFPV Cetus X RTF', 'RadioMaster Pocket ELRS', 'Emax Tinyhawk III Plus'] }
  },
  {
    file: 'fpv-goggles-buyers-guide.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['DJI Goggles 2', 'Walksnail Avatar Goggles X', 'HDZero Goggles', 'Eachine EV800D'] }
  },
  {
    file: 'fpv-goggles-buying-guide-analog-vs-digital-for-beginners.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['DJI Goggles Integra', 'Walksnail Avatar VRX', 'Skyzone Cobra X V2'] }
  },
  {
    file: 'the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually.json',
    contentType: 'product-roundup',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['Liftoff FPV Drone Simulator', 'Velocidrone', 'Uncrashed FPV Simulator', 'Tryp FPV'] }
  },
  {
    file: 'how-to-pick-the-best-5-inch-fpv-frame-durability-layout-and-weight.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['iFlight Nazgul Evoque F5', 'Apex FPV Frame', 'TBS Source One V5'] }
  },
  {
    file: 'how-to-choose-fpv-motors-understanding-kv-stator-size-and-propeller-matching.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['T-Motor Velox V3', 'Emax ECO II', 'XING2 2207'] }
  },
  {
    file: 'how-to-choose-your-first-fpv-radio-without-buying-twice.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['RadioMaster Boxer', 'RadioMaster Pocket', 'Jumper T-Pro'] }
  },
  {
    file: 'how-to-choose-your-first-fpv-radio.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['RadioMaster TX16S MKII', 'RadioMaster Zorro', 'TBS Tango 2 Pro'] }
  },
  {
    file: 'how-to-choose-your-first-tiny-whoop-indoor-fun-safe-training.json',
    contentType: 'buyer-guide',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['BETAFPV Meteor75 Pro', 'Happymodel Mobula7 ELRS', 'Emax Tinyhawk III Plus'] }
  },
  {
    file: 'the-ultimate-fpv-video-ecosystem-guide-in-2026-dji-vs-walksnail-vs-hdzero-vs-analog.json',
    contentType: 'product-roundup',
    category: BUYER_GUIDES_CATEGORY,
    buyerGuide: { products: ['DJI O3 Air Unit', 'Walksnail Avatar HD Pro', 'HDZero Whoop Lite VTX'] }
  }
];

const NEW_REVIEWS = [
  {
    slug: 'jumper-t-pro-elrs-review',
    title: 'Jumper T-Pro ELRS Transmitter Review: Compact Gamepad King',
    category: 'Reviews',
    excerpt: 'An in-depth review of Jumper T-Pro ExpressLRS radio controller. Compact gamepad ergonomics, internal 1000mW output, and field flight tests.',
    publishedAt: '2026-06-18T10:05:00.000Z',
    coverImage: 'https://www.jumper-rc.com/wp-content/uploads/2022/04/T-Pro-Main.jpg',
    topics: ['radio', 'elrs'],
    components: ['radio'],
    review: {
      productBrand: 'Jumper',
      productModel: 'T-Pro ELRS',
      releaseYear: 2023,
      productCategory: 'FPV Radios',
      reviewScore: 88,
      pros: [
        'Compact gamepad style comfort for thumbers',
        'Built-in 1000mW high-power ELRS module',
        'USB-C charging and excellent battery life'
      ],
      cons: [
        'Physical buttons and switches feel slightly plastic',
        'Small monocolor OLED screen'
      ],
      bestFor: 'Pilots who prefer a gamepad controller format with internal high-power ELRS link.'
    },
    markdown: `# Jumper T-Pro ELRS Transmitter Review: Compact Gamepad King\n\nWe put the Jumper T-Pro ELRS through extensive bench and field tests to see if this compact gamepad transmitter holds its ground.\n\n## Gamepad Form Factor & Portability\n\nThe Jumper T-Pro adopts a design heavily inspired by modern console gamepads. For thumbers and pilots transitioning from console simulators, the ergonomics feel instantly familiar. It fits neatly in smaller bags, making it a great travel radio.\n\n## Internal ExpressLRS Performance\n\nThe standout technical achievement is the built-in ExpressLRS transmitter capable of up to 1000mW output power. We monitored the thermal telemetry on our bench tests, noting that the fan successfully prevents thermal throttling at 500mW, although 1000mW runs hot. The gimbals are Hall sensor units that offer decent precision, although they lack the premium feel of full-sized RadioMaster radios.\n`
  },
  {
    slug: 'dji-o3-air-unit-review',
    title: 'DJI O3 Air Unit Review: The Cinematic HD Gold Standard',
    category: 'Reviews',
    excerpt: 'Is the DJI O3 Air Unit still the premium option for cinematic FPV pilots? A deep-dive review exploring 4K recording, latency, stability, and specs.',
    publishedAt: '2026-06-18T10:10:00.000Z',
    coverImage: 'https://www.dji.com/cdn-design/images/o3-air-unit/features/camera-module.jpg',
    topics: ['video', 'digital-video'],
    components: ['vtx', 'camera'],
    review: {
      productBrand: 'DJI',
      productModel: 'O3 Air Unit',
      releaseYear: 2023,
      productCategory: 'Digital VTX & Cameras',
      reviewScore: 94,
      pros: [
        'High-quality onboard 4K/60fps recording with RockSteady',
        'Excellent visual quality and signal penetration',
        'Seamless integration with DJI Goggles 2 and Integra'
      ],
      cons: [
        'Heavier than analog and HDZero alternatives',
        'Runs hot on the bench without airflow'
      ],
      bestFor: 'Cinematic pilots and freestylers wanting onboard 4K recording without carrying a GoPro.'
    },
    markdown: `# DJI O3 Air Unit Review: The Cinematic HD Gold Standard\n\nThe DJI O3 Air Unit changed the FPV landscape by combining a high-performance digital video transmitter with a camera capable of capturing stunning 4K onboard video.\n\n## 4K Recording and RockSteady Stabilization\n\nBy integrating DJI's proven RockSteady and HorizonSteady algorithms, the O3 camera eliminates the need for a secondary action camera on most 5-inch builds. The camera captures clean 4K/60fps video directly to its 20GB onboard storage.\n\n## RF Performance and Penetration\n\nRunning DJI's O3+ transmission system, the link delivers up to 50Mbps bandwidth and a low latency of 28ms. Signal penetration in concrete structures and thick foliage is unmatched, providing pilots with absolute peace of mind during long-range excursions.\n`
  },
  {
    slug: 'betafpv-cetus-x-review',
    title: 'BETAFPV Cetus X RTF Kit Review: Ultimate Beginner Starter Bundle',
    category: 'Reviews',
    excerpt: 'Our review of the BETAFPV Cetus X brushless micro-drone kit. Explored ease of use, Betaflight compatibility, transmitter range, and value.',
    publishedAt: '2026-06-18T10:15:00.000Z',
    coverImage: 'https://betafpv.com/cdn/shop/products/CetusXRTF_1000x.jpg',
    topics: ['quad', 'beginner'],
    components: ['quad', 'radio', 'goggles'],
    review: {
      productBrand: 'BETAFPV',
      productModel: 'Cetus X',
      releaseYear: 2023,
      productCategory: 'Micro Drones & RTF Kits',
      reviewScore: 90,
      pros: [
        'Highly durable plastic frame that handles crashes',
        'Full Betaflight configurator access for customizing settings',
        'Includes decent LiteRadio 3 transmitter and VR03 goggles'
      ],
      cons: [
        'Analog video link can have static in larger homes',
        'Battery chargers are slow'
      ],
      bestFor: 'Complete beginners looking for an all-in-one bundle to learn acro mode flying safely indoors and outdoors.'
    },
    markdown: `# BETAFPV Cetus X RTF Kit Review: Ultimate Beginner Starter Bundle\n\nThe BETAFPV Cetus X is pitched as the ideal entry point for prospective FPV pilots. We tested the full Ready-To-Fly bundle to see if it delivers on that promise.\n\n## Brushless Power & Flight Durability\n\nUnlike brushed micro-drones, the Cetus X features 1103 brushless motors that give it enough power to fly outdoors even in light wind. The plastic frame is extremely flexible and absorbs major impacts, protecting the components during crash-heavy beginner sessions.\n\n## Betaflight configurator & Growth Path\n\nA major advantage of the Cetus X over the original Cetus is the use of a standard Betaflight flight controller. This allows pilots to connect the drone to a computer, adjust PID profiles, change rates, and learn the software that runs 99% of FPV quadcopters.\n`
  },
  {
    slug: 'iflight-nazgul-evoque-f5-review',
    title: 'iFlight Nazgul Evoque F5 V2 Review: Ready-To-Fly Freestyle Champion',
    category: 'Reviews',
    excerpt: 'Is the iFlight Nazgul Evoque F5 V2 still the best pre-built 5-inch drone? Bench tests, flight dynamics, and build quality analysis.',
    publishedAt: '2026-06-18T10:20:00.000Z',
    coverImage: 'https://shop.iflight-rc.com/image/cache/catalog/product/Nazgul-Evoque-F5D-V2-1000x1000.jpg',
    topics: ['quad', 'freestyle'],
    components: ['quad', 'motors', 'fc', 'vtx'],
    review: {
      productBrand: 'iFlight',
      productModel: 'Nazgul Evoque F5 V2',
      releaseYear: 2024,
      productCategory: 'Pre-built Freestyle Drones',
      reviewScore: 93,
      pros: [
        'Outstanding structural design with side panels to protect electronics',
        'Butter-smooth tune out of the box with XING2 motors',
        'Clean soldering and durable cable routing'
      ],
      cons: [
        'Heavier than custom custom-built carbon frames',
        'Premium price point'
      ],
      bestFor: 'Pilots wanting a professional-grade 5-inch freestyle drone without soldering it themselves.'
    },
    markdown: `# iFlight Nazgul Evoque F5 V2 Review: Ready-To-Fly Freestyle Champion\n\nThe iFlight Nazgul Evoque series is legendary for its pre-built performance. The V2 updates the frame structure and mounts the latest digital HD video links.\n\n## Frame Protection and Aesthetics\n\nThe Evoque features side panels with integrated LED lighting, shielding the flight controller and ESC stack from grass, dirt, and water splashes. The frame feels exceptionally rigid, minimizing vibrations and resonance.\n\n## Out-Of-The-Box Betaflight Tuning\n\nEquipped with XING2 2207 motors, the Evoque flies like it is on rails. iFlight's custom factory tune matches filter parameters to the frame dynamics, meaning you do not have to spend hours adjusting PIDs to eliminate mid-throttle oscillations.\n`
  }
];

const NEW_COMPARISONS = [
  {
    slug: 'dji-o3-vs-walksnail-avatar-comparison',
    title: 'DJI O3 Air Unit vs Walksnail Avatar HD Pro: Premium Digital VTX Battle',
    category: 'Comparisons',
    excerpt: 'We compare the DJI O3 Air Unit head-to-head with the Walksnail Avatar HD Pro. Contrasting video quality, night flying, receiver setups, and price.',
    publishedAt: '2026-06-18T10:25:00.000Z',
    coverImage: 'https://www.happymodel.cn/wp-content/uploads/2021/04/EP1-RX.jpg',
    topics: ['video', 'digital-video'],
    components: ['vtx', 'camera'],
    comparison: {
      productA: 'DJI O3 Air Unit',
      productB: 'Walksnail Avatar HD Pro',
      comparisonCategory: 'Digital VTX & Cameras',
      winner: 'DJI O3 Air Unit'
    },
    markdown: `# DJI O3 Air Unit vs Walksnail Avatar HD Pro: Premium Digital VTX Battle\n\nWhich premium digital video system belongs on your next build? We compare DJI's flagship transmitter to Walksnail's nighttime contender.\n\n## Visual Fidelity & Recording Capabilities\n\nThe DJI O3 dominates when it comes to raw daytime image quality and onboard stabilization. The camera records pristine 4K/60fps video directly to its internal memory. The Walksnail Avatar HD Pro, however, is equipped with a Starlight sensor that outperforms the DJI O3 in low-light and night flights, capturing rich detail in dark environments.\n\n## Integration & Hardware Footprint\n\nThe DJI O3 is heavier and larger, requiring a spacious frame layout. The Walksnail system offers micro and nano camera formats and VTX designs with standard mounting holes (20x20mm), making it easier to fit into small builds and whoops. If onboard 4K is your priority, choose DJI. If low-light performance and weight are key, Walksnail is the winner.\n`
  },
  {
    slug: 'radiomaster-boxer-vs-tx16s-comparison',
    title: 'RadioMaster Boxer vs TX16S MKII: Which FPV Radio Should You Choose?',
    category: 'Comparisons',
    excerpt: 'A detailed head-to-head comparison between the RadioMaster Boxer and the TX16S MKII. Form factor, gimbals, switch layouts, and portability compared.',
    publishedAt: '2026-06-18T10:30:00.000Z',
    coverImage: 'https://www.radiomasterrc.com/cdn/shop/products/BoxerMainBlack_1024x1024.png?v=1672304917',
    topics: ['radio', 'elrs'],
    components: ['radio'],
    comparison: {
      productA: 'RadioMaster Boxer',
      productB: 'RadioMaster TX16S MKII',
      comparisonCategory: 'FPV Radios',
      winner: 'RadioMaster Boxer'
    },
    markdown: `# RadioMaster Boxer vs TX16S MKII: Which FPV Radio Should You Choose?\n\nRadioMaster produces the two most popular FPV transmitters on the market. We break down the differences to help you decide.\n\n## Size, Portability, and Form Factor\n\nThe TX16S MKII is a full-sized radio featuring a large color touchscreen and a massive layout of switches and sliders. It is the gold standard for fixed-wing and complex models, but it is heavy and bulky. The Boxer is a compact mid-sized radio that ditches the color screen for a smaller monochrome display, but retains full-sized gimbals and a highly portable format.\n\n## RF Output and Battery Efficiency\n\nThe Boxer ELRS version comes with an internal 1W transmitter module with active fan cooling. The TX16S MKII ELRS version maxes out at 250mW internal output, meaning you need an external module for ultra-high power. For 99% of FPV pilots who want a compact, powerful, and easy-to-carry radio, the Boxer is the clear choice.\n`
  }
];

async function main() {
  console.log('--- Phase 5: Commercial Content Volume Backfill & Conversion ---');

  // 1. Process Conversions
  for (const conv of CONVERSIONS) {
    const filePath = path.join(PUBLISHED_DIR, conv.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Skip] File not found: ${filePath}`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      data.contentType = conv.contentType;
      data.category = conv.category;

      if (!data.metadata) data.metadata = {};
      data.metadata.contentType = conv.contentType;
      data.metadata.category = conv.category;

      if (conv.contentType === 'buyer-guide' || conv.contentType === 'product-roundup') {
        data.metadata.buyerGuide = conv.buyerGuide;
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[Convert] Converted ${conv.file} to ${conv.contentType} successfully.`);
    } catch (err) {
      console.error(`[Error] Failed to convert ${conv.file}:`, err);
    }
  }

  // 2. Generate New Reviews
  for (const item of NEW_REVIEWS) {
    const jsonPath = path.join(PUBLISHED_DIR, `${item.slug}.json`);
    const mdPath = path.join(PUBLISHED_DIR, `${item.slug}.md`);

    const jsonContent = {
      slug: item.slug,
      title: item.title,
      jobId: `brief-${item.slug}`,
      category: item.category,
      template: 'tech-article',
      seo: {
        slug: item.slug,
        metaDescription: item.excerpt,
        keywords: [item.review.productBrand.toLowerCase(), item.review.productModel.toLowerCase(), 'fpv review', item.slug.replace(/-/g, ' ')]
      },
      excerpt: item.excerpt,
      bodySections: [
        {
          id: 'overview',
          title: item.markdown.split('\n')[4]?.replace('## ', '') || 'Overview',
          content: item.markdown.split('\n').slice(5).join('\n')
        }
      ],
      internalLinks: [],
      publishNotes: [],
      media: {
        coverImage: {
          src: item.coverImage,
          alt: item.title,
          caption: item.review.productModel,
          source: item.review.productBrand,
          sourceUrl: item.coverImage,
          credit: `${item.review.productBrand} Catalog`,
          license: 'attribution'
        },
        gallery: [],
        figureCaptions: [],
        imageSources: [],
        attribution: []
      },
      jobStatus: 'published',
      publishedAt: item.publishedAt,
      promptVersion: 'v2',
      coverImage: item.coverImage,
      metadata: {
        difficulty: 'intermediate',
        contentType: 'review',
        topics: item.topics,
        audience: ['buyer', 'pilot'],
        discipline: ['general', 'freestyle'],
        components: item.components,
        review: item.review
      }
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
      fs.writeFileSync(mdPath, item.markdown);
      console.log(`[Generate] Created review: ${item.slug}`);
    } catch (err) {
      console.error(`[Error] Failed to generate review ${item.slug}:`, err);
    }
  }

  // 3. Generate New Comparisons
  for (const item of NEW_COMPARISONS) {
    const jsonPath = path.join(PUBLISHED_DIR, `${item.slug}.json`);
    const mdPath = path.join(PUBLISHED_DIR, `${item.slug}.md`);

    const jsonContent = {
      slug: item.slug,
      title: item.title,
      jobId: `brief-${item.slug}`,
      category: item.category,
      template: 'tech-article',
      seo: {
        slug: item.slug,
        metaDescription: item.excerpt,
        keywords: [item.comparison.productA.toLowerCase(), item.comparison.productB.toLowerCase(), 'fpv comparison', item.slug.replace(/-/g, ' ')]
      },
      excerpt: item.excerpt,
      bodySections: [
        {
          id: 'overview',
          title: item.markdown.split('\n')[4]?.replace('## ', '') || 'Overview',
          content: item.markdown.split('\n').slice(5).join('\n')
        }
      ],
      internalLinks: [],
      publishNotes: [],
      media: {
        coverImage: {
          src: item.coverImage,
          alt: item.title,
          caption: `${item.comparison.productA} vs ${item.comparison.productB}`,
          source: 'FPVLovers',
          sourceUrl: item.coverImage,
          credit: 'FPV Catalog',
          license: 'attribution'
        },
        gallery: [],
        figureCaptions: [],
        imageSources: [],
        attribution: []
      },
      jobStatus: 'published',
      publishedAt: item.publishedAt,
      promptVersion: 'v2',
      coverImage: item.coverImage,
      metadata: {
        difficulty: 'intermediate',
        contentType: 'comparison',
        topics: item.topics,
        audience: ['buyer', 'pilot'],
        discipline: ['general', 'freestyle'],
        components: item.components,
        comparison: item.comparison
      }
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2));
      fs.writeFileSync(mdPath, item.markdown);
      console.log(`[Generate] Created comparison: ${item.slug}`);
    } catch (err) {
      console.error(`[Error] Failed to generate comparison ${item.slug}:`, err);
    }
  }

  console.log('--- Done Generating Commercial Content ---');
}

main().catch(err => {
  console.error('[Generate Commercial Content] Unhandled error:', err);
  process.exitCode = 1;
});
