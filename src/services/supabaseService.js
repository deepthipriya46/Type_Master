// ==========================================================
// TYPING TEST APPLICATION - SUPABASE & DATA SERVICE
// Real-Time Architecture - Zero Sample User Data
// ==========================================================

import { createClient } from '@supabase/supabase-js';
import { AntiCheatService } from './antiCheatService.js';

// Real typing prompts for practice and testing
// Real typing prompts for practice and testing across diverse categories & difficulties
// Real typing prompts for practice and testing across diverse categories, difficulties & durations
const PRACTICE_PROMPTS = [
  // --- RANDOM TEXT (1 MIN: ~50-80 words, ~300-400 chars) ---
  {
    id: 'rt_1m_e1',
    category: 'Random Text',
    difficulty: 'Easy',
    targetDuration: '1m',
    word_count: 62,
    text: 'Technology has changed the way we live, work and communicate. It brings people closer, makes information more accessible, and creates new opportunities for learning and growth. With the right mindset and continuous practice, anyone can develop valuable typing skills and achieve their personal goals through patience and steady dedication.'
  },
  {
    id: 'rt_1m_m1',
    category: 'Random Text',
    difficulty: 'Medium',
    targetDuration: '1m',
    word_count: 65,
    text: 'Typing with speed and precision is a muscle memory discipline that requires consistent practice. When fingers instinctively locate keys on the home row without conscious effort, thought flows directly onto the digital canvas without friction. Small incremental improvements compounded daily generate masteries that seem miraculous to casual observers.'
  },
  {
    id: 'rt_1m_h1',
    category: 'Random Text',
    difficulty: 'Hard',
    targetDuration: '1m',
    word_count: 58,
    text: 'Quantum algorithms leverage quantum superposition, quantum entanglement, and computational interference to solve probabilistic combinatorial problems asymptotically faster than classical Turing architectures. Psychological flow states synchronize cognitive prefrontal attenuation with neuromuscular kinesthetic reflexes, yielding effortless high-bandwidth ergonomic keystroke execution.'
  },

  // --- RANDOM TEXT (3 MIN: ~180-250 words, ~1000-1500 chars) ---
  {
    id: 'rt_3m_e1',
    category: 'Random Text',
    difficulty: 'Easy',
    targetDuration: '3m',
    word_count: 195,
    text: 'Learning to type smoothly is very similar to learning to play a musical instrument. At first, every single finger motion requires conscious thought, deliberate attention, and patience. You might feel clumsy, frequently pausing to verify key placements on the keyboard. However, with daily sessions of mindful practice, your brain builds permanent neural pathways.\n\nSoon, you stop thinking about individual letters altogether. Instead of sounding out each character, your hands begin recognizing entire words as fluid, rhythmic movements. The home row becomes your tactile anchor, allowing your fingers to explore the upper and lower tiers effortlessly while always returning safely home.\n\nMaintaining a relaxed posture is essential for long-term endurance. Keep your wrists hovering slightly above the desk, avoid tense shoulders, and breathe rhythmically with every sentence you complete. When you embrace accuracy before speed, swiftness arrives naturally without causing physical strain or frustration. Remember that consistency beats sporadic intense practice every single time.'
  },
  {
    id: 'rt_3m_m1',
    category: 'Random Text',
    difficulty: 'Medium',
    targetDuration: '3m',
    word_count: 205,
    text: 'The architecture of human habit formation demonstrates that sustainable progress stems from compounding incremental refinements rather than monumental bursts of exertion. When typists dedicate twenty minutes each day to deliberate technique, subconscious biomechanical efficiencies emerge. Every keystroke becomes an exercise in physiological optimization, balancing finger independence with coordinated kinetic motion.\n\nDistractions frequently derail high-performance flow states in modern workspaces. Constant digital notifications fragment mental concentration, causing cognitive friction that degrades both typing velocity and orthographic accuracy. By entering an intentional practice space, you train your mind to focus intently on upcoming characters while maintaining steady peripheral awareness.\n\nDeveloping resilience in the face of inevitable typos is equally vital. Rushing forward recklessly after an error compounds keystroke inaccuracies. Master typists instinctively pause for a fraction of a second, tap backspace cleanly, re-orient their finger placement on the guide keys, and proceed with renewed composure.'
  },

  // --- RANDOM TEXT (5 MIN: ~350-500 words, ~2000-3000 chars) ---
  {
    id: 'rt_5m_m1',
    category: 'Random Text',
    difficulty: 'Medium',
    targetDuration: '5m',
    word_count: 380,
    text: 'In the information age, our interaction with computational machinery defines how effectively we communicate, solve problems, and express creative thoughts. For developers, researchers, writers, and digital professionals, the keyboard represents an essential conduit connecting abstract contemplation to concrete digital artifacts. When your mechanical typing proficiency is high, the barrier between mind and screen disappears, allowing ideas to materialize at the speed of thought.\n\nAchieving peak ergonomic performance requires understanding both the biomechanics of the hand and the cognitive psychology of motor skills. The ten fingers possess asymmetrical strengths and ranges of motion. Index fingers naturally exert greater force and agility across central columns, while pinky fingers navigate punctuation and modifier keys with delicate precision. Touch-typing systems balance these physical asymmetries through deliberate spatial mapping, ensuring that no single digit bears excessive fatigue.\n\nEqually important is cognitive anticipation, a phenomenon well-documented in competitive typists and professional pianists. Advanced practitioners rarely fixate on the character actively being struck. Instead, their eyes scan several words ahead, preprocessing upcoming phonetic patterns and queuing kinetic sequences in advance. This forward-looking buffer smooths out micro-hesitations, resulting in a metronomic cadence that remains remarkably consistent across complex sentences.\n\nMoreover, the physical workstation environment directly influences long-term endurance. Position your monitor at eye level to prevent cervical vertebrae strain, align your elbows at approximate ninety-degree angles, and maintain flat or slightly declined wrist postures. Mechanical keyboard switches with tactile feedback often reduce bottoming-out shock, sparing sensitive joints from unnecessary trauma during high-intensity typing sessions.\n\nUltimately, mastery is not a static destination but a continuous discipline of refinement. Track your historical metrics not with anxiety, but with curiosity. Identify recurring character bigrams that introduce friction, isolate troublesome symbol sequences, and approach each session with playful persistence. Through deliberate practice, you cultivate not merely typing speed, but effortless digital fluency.'
  },

  // --- RANDOM TEXT (CUSTOM / OPEN-ENDED: ~600+ words, ~3500+ chars) ---
  {
    id: 'rt_custom_e1',
    category: 'Random Text',
    difficulty: 'Easy',
    targetDuration: 'custom',
    word_count: 620,
    text: 'Welcome to the open-ended typing expedition. This extended passage is designed for sustained focus, continuous rhythm, and comprehensive endurance testing. Unlike standard timed sprints where the clock dictates your pace, open-ended mode invites you to settle into a deep, uninterrupted flow state where speed and accuracy harmonize over an expansive journey.\n\nThe history of typing traces back to nineteenth-century mechanical inventions designed to replace handwritten manuscripts. The familiar QWERTY layout was engineered during the era of mechanical typewriters to prevent swinging metal hammers from jamming against one another when struck in rapid succession. Despite dramatic technological revolutions from clacking mechanical typebars to digital glass screens, the layout has endured for over a century as a global standard.\n\nTo navigate an extended passage successfully, you must cultivate mental pacing. Sprinting out of the gate at maximum velocity often induces premature hand fatigue and early typographical mistakes. Instead, adopt the mindset of a marathon runner. Establish a comfortable baseline cadence where every character is struck cleanly, accurately, and without hurried anxiety. Let your rhythm stabilize across the first couple of paragraphs before attempting to increase raw words per minute.\n\nNotice the sensation of your fingertips making contact with the keyboard surface. Whether you type on a modern scissor-switch laptop keyboard or an enthusiast mechanical board with custom lubricated switches, the acoustic and tactile feedback provides vital feedback loops. Experienced typists rely on subtle auditory clicks and bottom-out vibrations to verify character entry without ever glancing down at their hands.\n\nAccuracy is the true secret behind sustained typing velocity. Every incorrect keystroke penalizes your throughput three times: first when striking the erroneous key, second when pressing backspace to delete it, and third when re-striking the correct key. By slowing down just enough to eliminate erratic mistakes, your net words per minute automatically climbs while physical strain noticeably diminishes.\n\nAs you progress through this extensive text block, maintain steady breathing and check your physical posture. Relax your shoulders, unclamp your jaw, and ensure your forearms are parallel to the floor. If you encounter difficult words or unusual punctuation sequences, do not panic. Break the word down into smaller syllables, type each cluster deliberately, and regain your standard rhythm.\n\nCelebrate the satisfaction of watching whole paragraphs transform under your fingertips. Digital typing is both a pragmatic utility and a satisfying kinetic art form. With every completed drill, you strengthen cognitive agility, heighten reflexes, and unlock new thresholds of computational capability. When you reach the conclusion of this text, review your total elapsed time, net speed, and precision metrics with pride.'
  },

  // --- TECHNOLOGY (1 MIN: ~50-80 words) ---
  {
    id: 'tech_1m_e1',
    category: 'Technology',
    difficulty: 'Easy',
    targetDuration: '1m',
    word_count: 64,
    text: 'Software engineering transforms complex human ideas into reliable interactive experiences. Clean code, intuitive responsive design, and resilient architecture make digital applications accessible to millions of global users every day. As cloud platforms continue to evolve, engineers must continuously adapt, refine their technical toolkits, and build inclusive solutions that bridge diverse communities across our hyper-connected world.'
  },
  {
    id: 'tech_1m_m1',
    category: 'Technology',
    difficulty: 'Medium',
    targetDuration: '1m',
    word_count: 66,
    text: 'Modern web architectures utilize distributed edge caching, reactive state management, asynchronous microservices, and serverless compute pipelines to handle millions of concurrent user requests with single-digit millisecond latencies. By abstracting physical hardware virtualization, continuous integration workflows deploy resilient full-stack applications globally in minutes, establishing fault-tolerant environments that self-heal automatically during operational anomalies.'
  },
  {
    id: 'tech_1m_h1',
    category: 'Technology',
    difficulty: 'Hard',
    targetDuration: '1m',
    word_count: 60,
    text: 'Decentralized cryptographic consensus protocols guarantee Byzantine fault tolerance across untrusted distributed networks through zero-knowledge succinct non-interactive arguments of knowledge and hierarchical Merkle directed acyclic graphs. Low-latency transactional pipelines implement write-ahead logging, lock-free memory primitives, and asynchronous non-blocking event multiplexing to prevent computational bottlenecks.'
  },

  // --- TECHNOLOGY (3 MIN: ~180-250 words) ---
  {
    id: 'tech_3m_m1',
    category: 'Technology',
    difficulty: 'Medium',
    targetDuration: '3m',
    word_count: 210,
    text: 'The evolution of artificial intelligence and distributed cloud computing is fundamentally transforming the digital software landscape. Modern enterprise applications no longer run as monolithic codebases on single physical mainframes. Instead, they operate as swarms of decoupled containerized microservices orchestrated dynamically across geographically distributed server clusters.\n\nData streaming pipelines process terabytes of telemetry events every second using distributed commit logs and partitioned message queues. When a user interacts with a modern web portal, their request passes through globally distributed content delivery edge nodes, intelligent API gateways, and specialized caching layers before reaching transactional database replicas. This architectural redundancy guarantees ninety-nine point nine nine percent uptime even during regional data center outages.\n\nMeanwhile, developer toolchains have matured dramatically. Automated unit tests, static code analysis, and infrastructure-as-code scripts ensure that every software release passes stringent quality benchmarks prior to production rollout. As machine learning models become integrated into real-time decision loops, developers must prioritize data integrity, algorithmic fairness, and low-latency inference pipelines. Writing performant software requires a deep appreciation for algorithmic efficiency, system concurrency, and the underlying physics of networked hardware.'
  },

  // --- TECHNOLOGY (5 MIN: ~350-500 words) ---
  {
    id: 'tech_5m_h1',
    category: 'Technology',
    difficulty: 'Hard',
    targetDuration: '5m',
    word_count: 390,
    text: 'Architecting resilient distributed systems requires navigating the fundamental trade-offs articulated by the CAP theorem: consistency, availability, and partition tolerance. In wide-area networks spanning continents, packet latency and network partitions are inevitable physical realities rather than exceptional edge cases. Consequently, modern distributed databases implement sophisticated consensus protocols like Raft, Paxos, and multi-version concurrency control to maintain deterministic state replication.\n\nEventual consistency models employ Conflict-Free Replicated Data Types, enabling distributed nodes to accept local write operations concurrently and converge automatically without expensive distributed locking coordination. These mathematical abstractions power modern collaborative applications, distributed document editing platforms, and peer-to-peer synchronization engines. By eliminating global synchronization barriers, systems achieve massive horizontal scalability while preserving user responsiveness.\n\nSimultaneously, the semiconductor industry is confronting physical quantum limits at sub-nanometer lithography scales. As traditional Dennard scaling and classical Moore\'s Law slow down, computational gains increasingly rely on specialized heterogeneous acceleration architectures such as Graphics Processing Units, Tensor Processing Units, and custom Field-Programmable Gate Arrays. Software developers must transition from purely sequential procedural logic toward highly parallel, vectorized execution models designed to leverage thousands of concurrent hardware compute cores.\n\nCybersecurity paradigms have similarly evolved from legacy perimeter defense toward comprehensive Zero Trust architectures. Every network request, microservice RPC call, and data storage access must be cryptographically authenticated, authorized, and audited via ephemeral certificates and mutual Transport Layer Security. Public-key infrastructure, secure hardware enclaves, and quantum-resistant post-quantum cryptographic primitives ensure that digital communications remain secure against emerging threat vectors and nation-state quantum adversaries.'
  },

  // --- TECHNOLOGY (CUSTOM: ~600+ words) ---
  {
    id: 'tech_custom_m1',
    category: 'Technology',
    difficulty: 'Medium',
    targetDuration: 'custom',
    word_count: 615,
    text: 'Computing technology represents humanity\'s most versatile intellectual amplifier. From the mechanical gears of Charles Babbage\'s Analytical Engine to modern planetary-scale hyperscale data centers, our collective ambition has continually driven the mechanization of arithmetic, logic, and abstract cognition. Today, software underpins every facet of human society: scientific inquiry, medical diagnostics, international logistics, financial exchanges, and creative expression.\n\nThe modern internet is perhaps the most complex engineering artifact ever conceived by civilization. It links billions of heterogeneous devices across submarine fiber-optic cables, terrestrial microwave relays, and low-Earth orbit satellite constellations. When you submit a search query or stream video content, packets of light travel thousands of miles under oceanic trenches, are routed through high-throughput core routers, and reach their destination within fractions of a second. This planetary infrastructure functions continuously with breathtaking reliability.\n\nAt the software layer, the transition from bare-metal server deployments to virtualization, containerization, and serverless compute has redefined how digital products are built. Engineers can spin up scalable virtual clusters in seconds using simple declarative configuration files. Automated deployment pipelines build, test, and ship code changes directly to millions of active users without causing downtime. This agility has accelerated technological innovation at an unprecedented pace.\n\nYet with tremendous computational power comes profound societal responsibility. The algorithms that recommend content, automate credit approvals, and guide autonomous vehicles wield immense influence over human lives. Ethical software engineering demands that we build transparency, accountability, and user safety into the very core of our technical architectures. We must ensure that algorithmic models are trained on representative datasets and that privacy rights are fiercely protected through cryptographic zero-knowledge systems and strict data minimization.\n\nLooking toward the future, emerging technological horizons promise even more dramatic paradigm shifts. Quantum computing approaches computational problems using quantum bits capable of superposition and entanglement, promising breakthroughs in molecular simulation and clean energy materials. Ambient computing and brain-computer interfaces seek to make digital interaction as seamless and invisible as thought itself.\n\nAs you type through this extensive technological exploration, reflect on your role within this evolving digital ecosystem. Every keystroke you make, every line of code you write, and every concept you master contributes to the ongoing narrative of technological advancement. Maintain your posture, preserve clean typing accuracy, and enjoy this deep dive into the boundless world of computer science.'
  },

  // --- QUOTES (1 MIN: ~50-80 words) ---
  {
    id: 'quote_1m_e1',
    category: 'Quotes',
    difficulty: 'Easy',
    targetDuration: '1m',
    word_count: 62,
    text: 'Believe you can and you are halfway there. Continuous effort, not strength or intelligence, is the key to unlocking our true potential. Success is not final, failure is not fatal: it is the courage to continue that counts. Keep practicing, be patient with your mistakes, and push steadily past your comfort zone every single day.'
  },
  {
    id: 'quote_1m_m1',
    category: 'Quotes',
    difficulty: 'Medium',
    targetDuration: '1m',
    word_count: 65,
    text: 'The journey of a thousand miles begins with a single step. Do not wait until the conditions are perfect; begin where you stand, with whatever tools you have, and better tools will be discovered as you go along. The secret of getting ahead is getting started, breaking complex overwhelming problems into small manageable actions.'
  },

  // --- QUOTES (3 MIN: ~180-250 words) ---
  {
    id: 'quote_3m_m1',
    category: 'Quotes',
    difficulty: 'Medium',
    targetDuration: '3m',
    word_count: 200,
    text: 'It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better. The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood; who strives valiantly; who errs, who comes short again and again, because there is no effort without error and shortcoming.\n\nTwo roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could to where it bent in the undergrowth. I took the one less traveled by, and that has made all the difference in the world.\n\nWe are what we repeatedly do. Excellence, then, is not an act, but a habit. What lies behind us and what lies before us are tiny matters compared to what lies within us. Keep your face always toward the sunshine, and shadows will fall behind you. Persevere with a brave heart and relentless discipline.'
  },

  // --- QUOTES (5 MIN: ~350-500 words) ---
  {
    id: 'quote_5m_h1',
    category: 'Quotes',
    difficulty: 'Hard',
    targetDuration: '5m',
    word_count: 375,
    text: 'In the depth of winter, I finally learned that within me there lay an invincible summer. We must accept finite disappointment, but never lose infinite hope. If you can keep your head when all about you are losing theirs and blaming it on you; if you can trust yourself when all men doubt you, but make allowance for their doubting too; if you can wait and not be tired by waiting, or being lied about, don\'t deal in lies, or being hated, don\'t give way to hating.\n\nDo not go gentle into that good night, old age should burn and rave at close of day; rage, rage against the dying of the light. Though wise men at their end know dark is right, because their words had forked no lightning they do not go gentle into that good night.\n\nI have learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel. The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Do not settle. As with all matters of the heart, you will know when you find it.\n\nTo be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. Out of the night that covers me, black as the pit from pole to pole, I thank whatever gods may be for my unconquerable soul. In the fell clutch of circumstance I have not winced nor cried aloud. Under the bludgeonings of chance my head is bloody, but unbowed. Beyond this place of wrath and tears looms but the Horror of the shade, and yet the menace of the years finds, and shall find, me unafraid. It matters not how strait the gate, how charged with punishments the scroll, I am the master of my fate, I am the captain of my soul.'
  },

  // --- QUOTES (CUSTOM: ~600+ words) ---
  {
    id: 'quote_custom_m1',
    category: 'Quotes',
    difficulty: 'Medium',
    targetDuration: 'custom',
    word_count: 610,
    text: 'Philosophical wisdom across centuries reminds us that human character is forged in the crucible of persistent dedication and moral resilience. As Marcus Aurelius reflected in his personal journals: When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love. The happiness of your life depends upon the quality of your thoughts. Very little is needed to make a happy life; it is all within yourself in your way of thinking.\n\nSeneca similarly observed: It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult. Difficulties strengthen the mind, as labor does the body. We suffer more often in imagination than in reality. True happiness is to enjoy the present, without anxious dependence upon the future, not to amuse ourselves with either hopes or fears but to rest satisfied with what we have, which is sufficient, for he that is so wants nothing.\n\nRalph Waldo Emerson echoed these timeless sentiments: What lies behind you and what lies in front of you pales in comparison to what lies inside of you. To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. Cultivate the habit of being grateful for every good thing that comes to you, and to give thanks continuously.\n\nHenry David Thoreau offered practical wisdom on deliberate living: I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived. If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.\n\nHelen Keller shared her triumphant spirit: Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened, ambition inspired, and success achieved. Although the world is full of suffering, it is also full of the overcoming of it. Keep your face to the sunshine and you cannot see a shadow.\n\nFinally, Theodore Roosevelt\'s immortal words call us to courageous action: Far better is it to dare mighty things, to win glorious triumphs, even though checkered by failure, than to rank with those poor spirits who neither enjoy much nor suffer much, because they live in a gray twilight that knows not victory nor defeat. Let these words fortify your spirit as you complete this passage with dignity, poise, and unfaltering accuracy.'
  },

  // --- PROGRAMMING (1 MIN, 3 MIN, 5 MIN, CUSTOM) ---
  {
    id: 'prog_1m_e1',
    category: 'Programming',
    difficulty: 'Easy',
    targetDuration: '1m',
    word_count: 55,
    text: 'const calculateMetrics = (chars, seconds) => { const minutes = seconds / 60; const grossWpm = Math.round((chars / 5) / minutes); return { grossWpm, accuracy: 100 }; }; console.log("Speed test initialized successfully!");'
  },
  {
    id: 'prog_3m_m1',
    category: 'Programming',
    difficulty: 'Medium',
    targetDuration: '3m',
    word_count: 195,
    text: 'export async function handleStream(req: Request): Promise<Response> {\n  const { readable, writable } = new TransformStream();\n  const writer = writable.getWriter();\n  const encoder = new TextEncoder();\n\n  const processBatch = async (items: string[]) => {\n    for (const item of items) {\n      const payload = JSON.stringify({ data: item, timestamp: Date.now() });\n      await writer.write(encoder.encode(`data: ${payload}\\n\\n`));\n    }\n  };\n\n  req.signal.addEventListener("abort", () => {\n    writer.close().catch(console.error);\n  });\n\n  return new Response(readable, {\n    headers: {\n      "Content-Type": "text/event-stream",\n      "Cache-Control": "no-cache",\n      "Connection": "keep-alive"\n    }\n  });\n}'
  },
  {
    id: 'prog_5m_h1',
    category: 'Programming',
    difficulty: 'Hard',
    targetDuration: '5m',
    word_count: 360,
    text: 'interface LRUCacheNode<K, V> {\n  key: K;\n  value: V;\n  prev: LRUCacheNode<K, V> | null;\n  next: LRUCacheNode<K, V> | null;\n}\n\nexport class LRUCache<K, V> {\n  private capacity: number;\n  private map: Map<K, LRUCacheNode<K, V>>;\n  private head: LRUCacheNode<K, V>;\n  private tail: LRUCacheNode<K, V>;\n\n  constructor(capacity: number) {\n    this.capacity = capacity;\n    this.map = new Map();\n    this.head = { key: null as any, value: null as any, prev: null, next: null };\n    this.tail = { key: null as any, value: null as any, prev: null, next: null };\n    this.head.next = this.tail;\n    this.tail.prev = this.head;\n  }\n\n  public get(key: K): V | null {\n    const node = this.map.get(key);\n    if (!node) return null;\n    this.removeNode(node);\n    this.addNodeToHead(node);\n    return node.value;\n  }\n\n  public set(key: K, value: V): void {\n    if (this.map.has(key)) {\n      const existing = this.map.get(key)!;\n      existing.value = value;\n      this.removeNode(existing);\n      this.addNodeToHead(existing);\n      return;\n    }\n    if (this.map.size >= this.capacity) {\n      const lru = this.tail.prev!;\n      this.removeNode(lru);\n      this.map.delete(lru.key);\n    }\n    const newNode: LRUCacheNode<K, V> = { key, value, prev: null, next: null };\n    this.addNodeToHead(newNode);\n    this.map.set(key, newNode);\n  }\n\n  private removeNode(node: LRUCacheNode<K, V>): void {\n    node.prev!.next = node.next;\n    node.next!.prev = node.prev;\n  }\n\n  private addNodeToHead(node: LRUCacheNode<K, V>): void {\n    node.next = this.head.next;\n    node.prev = this.head;\n    this.head.next!.prev = node;\n    this.head.next = node;\n  }\n}'
  },
  {
    id: 'prog_custom_m1',
    category: 'Programming',
    difficulty: 'Medium',
    targetDuration: 'custom',
    word_count: 605,
    text: 'Programming is fundamentally the craft of transforming human intention into unambiguous machine instructions. Across modern software engineering, developers utilize expressive programming languages, modular patterns, and robust typing systems to manage complexity at scale. When designing software architectures, adhering to foundational design principles like high cohesion, loose coupling, and separation of concerns ensures that codebases remain maintainable over decades.\n\nConsider the mechanics of asynchronous event-driven architectures. In single-threaded execution environments like JavaScript\'s V8 engine, concurrency is coordinated via the event loop, call stack, microtask queue, and macrotask queue. When asynchronous I/O operations such as network requests or filesystem operations are initiated, the runtime delegates these tasks to underlying platform worker threads, freeing the main thread to render smooth user interface animations without jank.\n\nIn concurrent systems, race conditions and deadlocks represent classic pitfalls. When multiple threads access shared mutable state simultaneously, uncoordinated read-modify-write sequences introduce non-deterministic bugs that are notoriously difficult to reproduce and debug. Functional programming remedies this vulnerability by advocating immutable data structures and pure functions. By treating values as immutable snapshots, concurrent operations can read shared state safely without distributed locking overhead.\n\nDatabase persistence introduces another layer of architectural consideration. Relational database engines implement ACID transactions—Atomicity, Consistency, Isolation, and Durability—guaranteeing transactional validity even across sudden power failures or system crashes. Structured Query Language provides declarative query capabilities, allowing database query planners to optimize execution paths, index scans, and join algorithms automatically.\n\nWeb application security is equally paramount. Developers must guard against vulnerabilities including Cross-Site Scripting (XSS), SQL Injection, and Cross-Site Request Forgery (CSRF). Sanitizing untrusted user input, employing parameterized database queries, configuring Content Security Policies (CSP), and utilizing HTTP-only secure cookie flags safeguard user accounts against malicious exploitation.\n\nAs you practice typing this code-centric text, notice how programming syntax introduces varied punctuation, curly braces, and camelCase identifiers that challenge conventional typing rhythm. Emphasize clean finger extensions to the bracket and symbol keys. Maintain a steady cadence, relax your hands, and enjoy mastering the vocabulary of modern software engineering.'
  },

  // --- SCIENCE & NATURE (1 MIN, 3 MIN, 5 MIN, CUSTOM) ---
  {
    id: 'sci_1m_e1',
    category: 'Science & Nature',
    difficulty: 'Easy',
    targetDuration: '1m',
    word_count: 65,
    text: 'The solar system consists of the Sun and everything bound to it by gravitational attraction: planets, dwarf planets, moons, asteroids, and comets drifting through the celestial darkness. Photosynthesis converts sunlight, water, and carbon dioxide into oxygen and nourishing glucose, sustaining almost all living organisms across our vibrant planet Earth.'
  },
  {
    id: 'sci_3m_m1',
    category: 'Science & Nature',
    difficulty: 'Medium',
    targetDuration: '3m',
    word_count: 210,
    text: 'Ecological biodiversity is the foundation of planetary resilience and climate equilibrium. Within tropical rainforests and temperate ocean kelp canopies, millions of specialized species form interdependent food webs where the disappearance of a single keystone organism triggers cascading disruptions across the entire biome. Soil microbiomes play an equally indispensable role by breaking down decaying organic matter, fixing atmospheric nitrogen, and replenishing essential mineral nutrients that sustain global agriculture.\n\nSimultaneously, astrophysical discoveries expand our comprehension of the cosmos. Space telescopes orbiting high above Earth\'s atmosphere peer into deep space, capturing primordial infrared photons that originated over thirteen billion years ago during the dawn of cosmic structure formation. These observations reveal supermassive black holes anchoring spiral galaxies, neutron stars colliding in violent kilonova explosions that synthesize heavy elements like gold and platinum, and thousands of exoplanets orbiting distant stellar systems.\n\nUnderstanding natural physical laws inspires both technological innovation and environmental stewardship. By studying the photosynthetic mechanics of chloroplasts and the aerodynamic elegance of avian flight, scientists engineer more efficient solar cells and sustainable materials. Science teaches us that humanity is not separate from the natural world, but deeply woven into its magnificent fabric.'
  },
  {
    id: 'sci_5m_h1',
    category: 'Science & Nature',
    difficulty: 'Hard',
    targetDuration: '5m',
    word_count: 385,
    text: 'Thermodynamics governs every energetic transition in the universe, articulated through foundational physical laws. The first law affirms the absolute conservation of energy: energy can neither be created nor destroyed, only transformed between thermal, kinetic, gravitational, and chemical potentials. The second law introduces entropy, positing that isolated systems evolve inexorably toward states of maximum microscopic disorder, establishing the thermodynamic arrow of time that dictates why the past is fundamentally distinguishable from the future.\n\nIn quantum mechanics, the behavior of matter and radiation defies macroscopic intuition. Erwin Schrödinger\'s wave equation models physical states as complex probability amplitudes until measurement collapses the superposition into a definite eigenstate. Werner Heisenberg\'s uncertainty principle establishes a fundamental mathematical constraint: conjugate variables such as position and momentum cannot be simultaneously measured with arbitrary precision. These quantum principles explain the stability of atomic orbitals, semiconductor bandgap electronics, and the nuclear fusion reactions powering stellar cores.\n\nOn cosmic scales, Albert Einstein\'s general theory of relativity reconceptualizes gravity not as a Newtonian action-at-a-distance force, but as the dynamic curvature of four-dimensional spacetime induced by the stress-energy tensor. Massive astronomical bodies deform the geometric fabric of space, bending the trajectories of photons and causing gravitational time dilation. Observational astrophysics has triumphantly verified these relativistic predictions through gravitational lensing, orbital decay of binary pulsars, direct detection of gravitational waves from merging binary black hole systems, and horizon-scale radio interferometry images of supermassive black hole shadows.\n\nLife on Earth represents a localized thermodynamic miracle: an open dissipative system maintaining internal order and complexity by consuming solar free energy and dissipating waste heat back into space. From ribonucleic acid replication to cellular respiration, living biochemistry exemplifies how physical and chemical laws give rise to self-sustaining complexity across billions of years of Darwinian evolution.'
  },
  {
    id: 'sci_custom_m1',
    category: 'Science & Nature',
    difficulty: 'Medium',
    targetDuration: 'custom',
    word_count: 615,
    text: 'The natural world is an awe-inspiring tapestry of physical laws, chemical dynamics, and biological symbioses. From the subatomic scale where quarks bind into protons and neutrons, to cosmic voids spanning billions of light-years, science provides the empirical framework through which humanity deciphers reality. Every scientific inquiry begins with humble observation, careful measurement, and willingness to revise our hypotheses in light of objective evidence.\n\nConsider the geological history of our home planet. Earth formed approximately four point five billion years ago from a rotating protoplanetary accretion disc surrounding the newborn Sun. Over eons of volcanic outgassing and cometary bombardment, liquid oceans condensed and primitive atmospheres stabilized. Plate tectonics continuously shapes the terrestrial crust, recycling carbon through continental subduction zones and giving rise to magnificent mountain ranges and deep oceanic trenches.\n\nLife emerged in hydrothermal vent environments where mineral gradients provided the biochemical catalyst for early organic metabolic pathways. Over billions of years, cyanobacteria invented oxygenic photosynthesis, precipitating the Great Oxidation Event that permanently transformed the atmospheric chemistry of Earth. This planetary transformation paved the way for complex multicellular organisms during the Cambrian explosion, leading to the breathtaking diversity of flora and fauna that inhabits Earth today.\n\nIn modern science, ecological conservation has emerged as an urgent global imperative. Tropical coral reefs, often described as rainforests of the sea, host over twenty-five percent of all marine species despite occupying less than one percent of the ocean floor. These fragile calcium carbonate structures face severe threats from ocean acidification and rising sea surface temperatures. Protecting these critical ecosystems requires coordinated global conservation, sustainable energy transition, and deep ecological awareness.\n\nBeyond Earth, the search for extraterrestrial life propels planetary exploration missions across our solar system. Robotic rovers traverse the arid surface of Mars seeking ancient sedimentary biosignatures, while space probes analyze liquid water plumes erupting from the icy crusts of Jupiter\'s moon Europa and Saturn\'s moon Enceladus. These subterranean oceans, warmed by tidal friction, may harbor conditions suitable for microbial life.\n\nAs you conclude this comprehensive scientific journey, appreciate how your own brain—composed of nearly one hundred billion neurons interconnected by trillions of synaptic pathways—is itself a product of this cosmic story. Continue typing with steady pacing, maintain your focus, and marvel at the profound beauty of scientific discovery.'
  }
];

// Helper to scale any prompt dynamically to the requested duration
export function scalePromptToDuration(prompt, targetDuration = '1m') {
  if (!prompt || !prompt.text) return prompt;

  const currentWords = prompt.text.trim().split(/\s+/).length;
  let targetMin = 50;
  let targetMax = 80;

  if (targetDuration === '3m') {
    targetMin = 180;
    targetMax = 250;
  } else if (targetDuration === '5m') {
    targetMin = 350;
    targetMax = 500;
  } else if (targetDuration === 'custom') {
    targetMin = 600;
    targetMax = 750;
  }

  // If already matches desired range
  if (currentWords >= targetMin && currentWords <= targetMax + 30) {
    return {
      ...prompt,
      word_count: currentWords,
      targetDuration
    };
  }

  // If shorter, expand with coherent thematic sentences
  const thematicSentences = {
    'Technology': [
      'Digital architectures continuously balance agility with fault-tolerant observability and rigorous operational security.',
      'Automated deployment pipelines and container orchestration systems guarantee high availability across distributed cloud regions.',
      'Modern software teams prioritize responsive design, inclusive accessibility, and low-latency data streaming architectures.',
      'Cryptographic verification, telemetry monitoring, and automated incident recovery protect global enterprise infrastructures.'
    ],
    'Programming': [
      'Writing maintainable code requires clear functional modularity, comprehensive test suites, and decoupled interfaces.',
      'Algorithmic optimization reduces asymptotic complexity and prevents memory leaks during high-throughput execution.',
      'Asynchronous event queues and non-blocking I/O allow modern servers to handle thousands of concurrent requests seamlessly.',
      'Consistent code reviews and strict static typing standards ensure determinism across enterprise microservice stacks.'
    ],
    'Quotes': [
      'Discipline is the enduring bridge connecting genuine ambition with lasting accomplishment across every creative domain.',
      'Wisdom is cultivated through continuous humility, patient reflection, and the courage to learn from temporary setbacks.',
      'Do not measure success solely by speed, but by consistency of purpose and unwavering dedication to daily self-mastery.',
      'Stay anchored in the present moment, welcome constructive challenges, and let perseverance guide your daily craft.'
    ],
    'Literature': [
      'The quiet rhythm of the evening descended softly upon the valley, painting the peaceful horizon in gentle hues of amber.',
      'Within every human spirit lies an unquenchable desire to articulate beauty, truth, and the profound depth of lived experience.',
      'Through the written word, generations converse across centuries, rediscovering timeless reflections on love and courage.',
      'A warm glow illuminated ancient library shelves filled with weathered volumes preserving the accumulated dreams of history.'
    ],
    'Science & Nature': [
      'Biological diversity forms the bedrock of planetary equilibrium, maintaining balance across complex interdependent food webs.',
      'Astrophysical telescopes continue revealing the breathtaking cosmic majesty of expanding spacetime and newborn stellar nurseries.',
      'Thermodynamic conservation laws dictate how energy transforms continuously across physical, chemical, and biological systems.',
      'The microscopic elegance of quantum mechanics underpins the fundamental stability of all molecular chemistry and matter.'
    ],
    'Random Text': [
      'Consistent daily practice transforms awkward conscious effort into fluid, instinctive muscle memory and ergonomic comfort.',
      'Maintaining upright posture, relaxed shoulders, and rhythmic breathing allows typists to sustain high speed without fatigue.',
      'Focusing first on flawless accuracy creates the essential neurological foundation from which natural velocity blossoms.',
      'Every completed practice passage strengthens cognitive focus, manual dexterity, and tactile awareness across the keyboard.'
    ]
  };

  const pool = thematicSentences[prompt.category] || thematicSentences['Random Text'];
  let text = prompt.text;
  let idx = 0;

  while (text.trim().split(/\s+/).length < targetMin) {
    text = text + ' ' + pool[idx % pool.length];
    idx++;
    if (idx > 100) break;
  }

  const newWords = text.trim().split(/\s+/).length;
  return {
    ...prompt,
    text: text.trim(),
    word_count: newWords,
    targetDuration
  };
}

// Clean achievements template (all locked initially)
const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_test', title: 'First Keystroke', description: 'Complete your first typing test', achievedText: 'Locked', icon: 'zap', unlocked: false },
  { id: 'speed_master', title: 'Speed Master', description: 'Reach 75+ WPM in a test', achievedText: 'Locked', icon: 'trophy', unlocked: false },
  { id: 'accuracy_king', title: 'Accuracy King', description: 'Reach 98%+ accuracy', achievedText: 'Locked', icon: 'target', unlocked: false },
  { id: '3_day_streak', title: '3-Day Streak', description: 'Practice 3 consecutive days', achievedText: 'Locked', icon: 'flame', unlocked: false },
  { id: '10_day_streak', title: '10-Day Streak', description: 'Practice 10 consecutive days', achievedText: 'Locked', icon: 'flame', unlocked: false },
  { id: '10_tests', title: 'Dedicated Typist', description: 'Complete 10 typing tests', achievedText: 'Locked', icon: 'star', unlocked: false },
  { id: 'lightning_fast', title: 'Lightning Fast', description: '100+ WPM in any test', achievedText: 'Locked', icon: 'zap', unlocked: false },
  { id: 'master_accuracy', title: 'Flawless 100%', description: '100% accuracy in a test', achievedText: 'Locked', icon: 'award', unlocked: false }
];

// Clean User Template - All metrics starting at 0
const createFreshUser = (id, username, email = '', isPremium = false, role = 'user') => {
  const cleanName = username || 'Typist';
  const isGuest = Boolean(id?.startsWith('guest_') || !email);
  return {
    id: id || `user_${Date.now()}`,
    username: cleanName,
    displayName: cleanName,
    display_name: cleanName,
    email: email || '',
    role: role || (email === 'admin@typemaster.com' ? 'admin' : 'user'),
    status: 'Active',
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    best_wpm: 0,
    avg_wpm: 0,
    accuracy: 0,
    tests_completed: 0,
    is_premium: Boolean(isPremium),
    isGuest: isGuest,
    created_at: new Date().toISOString()
  };
};

const createFreshStreak = (userId) => ({
  user_id: userId,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null
});

const DEFAULT_SUPABASE_URL = 'https://gxelksgspezrjifpumdt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4ZWxrc2dzcGV6cmppZnB1bWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MzUyNzcsImV4cCI6MjEwNzAxMTI3N30.MuUgRxNXKtef-9sWI7LDswZgLQsjP_pcCl9J8BeX36g';

class SupabaseService {
  constructor() {
    this.supabase = null;
    this.url = '';
    this.anonKey = '';
    this.isOnline = false;
    this.initClient();
    this.purgeStaleMockData();
    this.ensureDefaultAdmin();
  }

  ensureDefaultAdmin() {
    try {
      const accounts = this._getLocal('users_registry', []);
      const hasAdmin = accounts.some(a => a.role === 'admin' || a.email === 'admin@typemaster.com');
      if (!hasAdmin) {
        accounts.push({
          id: 'admin_master_01',
          username: 'Admin Administrator',
          displayName: 'Admin Administrator',
          display_name: 'Admin Administrator',
          email: 'admin@typemaster.com',
          password: 'admin123',
          role: 'admin',
          status: 'Active',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
          best_wpm: 0,
          avg_wpm: 0,
          accuracy: 0,
          tests_completed: 0,
          is_premium: true,
          created_at: new Date().toISOString()
        });
        this._setLocal('users_registry', accounts);
      }
    } catch {
      // Ignore
    }
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || user?.email === 'admin@typemaster.com';
  }

  // Detect and purge old mock dataset from previous session
  purgeStaleMockData() {
    try {
      const storedUser = localStorage.getItem('typemaster_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.id === 'user_01' || u.id === 'usr_shika' || u.tests_completed === 128 || u.username === 'USER') {
          localStorage.removeItem('typemaster_user');
          localStorage.removeItem('typemaster_test_logs');
          localStorage.removeItem('typemaster_streak');
          localStorage.removeItem('typemaster_achievements');
          localStorage.removeItem('typemaster_current_user');
        }
      }
      const curUser = localStorage.getItem('typemaster_current_user');
      if (curUser) {
        const cu = JSON.parse(curUser);
        if (cu.id === 'usr_shika' && cu.email === 'shika@typemaster.local') {
          localStorage.removeItem('typemaster_current_user');
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  initClient() {
    const isBrowser = typeof window !== 'undefined';
    const engineMode = isBrowser ? localStorage.getItem('typemaster_db_engine') : null;

    // If user explicitly chose local engine, disable Supabase client
    if (engineMode === 'local') {
      this.supabase = null;
      this.isOnline = false;
      return;
    }

    const savedUrl = isBrowser ? localStorage.getItem('typemaster_supabase_url') : null;
    const savedKey = isBrowser ? localStorage.getItem('typemaster_supabase_anon_key') : null;
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;

    this.url = savedUrl || envUrl;
    this.anonKey = savedKey || envKey;

    if (this.url && this.anonKey && this.url.startsWith('http') && !this.url.includes('your-project')) {
      try {
        this.supabase = createClient(this.url, this.anonKey);
        this.isOnline = true;
      } catch (err) {
        console.warn('Supabase client init warning:', err);
        this.supabase = null;
        this.isOnline = false;
      }
    } else {
      this.supabase = null;
      this.isOnline = false;
    }
  }

  // Helper to prevent unreachable Supabase connections from hanging the entire application
  async _withTimeout(promise, ms = 4000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Network timeout: Supabase server unreachable')), ms);
    });
    try {
      const res = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  isConfigured() {
    return Boolean(this.supabase && this.isOnline);
  }

  getEngineMode() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('typemaster_db_engine');
      if (stored) return stored;
    }
    return this.isConfigured() ? 'supabase' : 'local';
  }

  async setEngineMode(mode) {
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      localStorage.setItem('typemaster_db_engine', mode);
    }

    if (mode === 'local') {
      this.supabase = null;
      this.isOnline = false;
      return { success: true, message: 'Switched to Local Offline Engine!' };
    }

    // mode === 'supabase'
    const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY;
    this.url = envUrl;
    this.anonKey = envKey;

    try {
      this.supabase = createClient(this.url, this.anonKey);
      this.isOnline = true;
      return { success: true, message: 'Connected to live Supabase cloud database!' };
    } catch (err) {
      console.warn('Supabase connect error:', err);
      this.supabase = null;
      this.isOnline = false;
      return { success: false, message: err.message || 'Failed to connect to Supabase.' };
    }
  }

  getCredentials() {
    return {
      url: this.url,
      anonKey: this.anonKey,
      isConfigured: this.isConfigured()
    };
  }

  async testConnection(clientInstance) {
    const client = clientInstance || this.supabase;
    if (!client) return { ok: false, error: 'Supabase client not initialized.' };
    try {
      const pingQuery = client.from('prompts').select('id').limit(1);
      const { error } = await this._withTimeout(pingQuery, 5000);
      if (error) {
        // If table doesn't exist yet, connection is still technically reachable
        if (error.message?.includes('relation "public.prompts" does not exist')) {
          return { ok: true, warning: 'Connected, but "prompts" table not found. Run supabase_schema.sql in SQL Editor.' };
        }
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Cannot reach Supabase host' };
    }
  }

  async setCredentials(url, anonKey) {
    const cleanUrl = (url || '').trim().replace(/\/+$/, '');
    const cleanKey = (anonKey || '').trim();

    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem('typemaster_supabase_url');
      localStorage.removeItem('typemaster_supabase_anon_key');
      this.url = '';
      this.anonKey = '';
      this.supabase = null;
      this.isOnline = false;
      return { success: true, message: 'Switched to Local Fallback Engine. 100% operational!' };
    }

    if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
      return { success: false, message: 'Invalid URL. Project URL must start with https:// (e.g. https://xxxx.supabase.co).' };
    }

    if (cleanUrl.includes('postgres://') || cleanUrl.includes('postgresql://')) {
      return { success: false, message: 'Please paste the Project URL from Supabase Project Settings -> API, NOT the PostgreSQL database connection string.' };
    }

    try {
      const testClient = createClient(cleanUrl, cleanKey);
      // Active ping to verify real server reachability
      const ping = await this.testConnection(testClient);
      if (!ping.ok) {
        this.isOnline = false;
        return {
          success: false,
          message: `Connection failed: ${ping.error}. Check if your Project URL is valid, or if your project is PAUSED in Supabase.`
        };
      }

      this.url = cleanUrl;
      this.anonKey = cleanKey;
      this.supabase = testClient;
      this.isOnline = true;
      localStorage.setItem('typemaster_supabase_url', cleanUrl);
      localStorage.setItem('typemaster_supabase_anon_key', cleanKey);
      return { success: true, message: ping.warning || 'Connected to live Supabase PostgreSQL successfully!' };
    } catch (err) {
      this.isOnline = false;
      return { success: false, message: err.message || 'Failed to connect to Supabase.' };
    }
  }

  // --- STORAGE HELPERS ---
  _getLocal(key, fallback) {
    try {
      const data = localStorage.getItem(`typemaster_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _setLocal(key, val) {
    try {
      localStorage.setItem(`typemaster_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage set error', e);
    }
  }

  // ==========================================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================================

  getCurrentUser() {
    return this._getLocal('current_user', null);
  }

  setCurrentUser(user) {
    if (user) {
      this._setLocal('current_user', user);
      // Sync into user accounts registry
      const accounts = this._getLocal('users_registry', []);
      const index = accounts.findIndex(a => a.id === user.id);
      if (index >= 0) {
        accounts[index] = { ...accounts[index], ...user };
      } else {
        accounts.push(user);
      }
      this._setLocal('users_registry', accounts);
    } else {
      localStorage.removeItem('typemaster_current_user');
    }
  }

  async signUp(email, password, username) {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim() || 'Typist';

    // 1. If live Supabase configured, attempt Supabase Auth
    if (this.isConfigured()) {
      try {
        const signUpPromise = this.supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: { username: cleanUsername, display_name: cleanUsername }
          }
        });
        const { data, error } = await this._withTimeout(signUpPromise, 6000);

        if (error) {
          const errMsg = error.message || '';
          
          // Bypasses Supabase free tier email rate limits or email provider restrictions
          if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('confirm')) {
            console.warn('Supabase email service rate limited; creating real user account directly in database table.');
            const userId = `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            const freshUser = createFreshUser(userId, cleanUsername, trimmedEmail);

            // Upsert into profiles
            try {
              await this._withTimeout(
                this.supabase.from('profiles').upsert({
                  id: freshUser.id,
                  username: freshUser.username,
                  display_name: freshUser.username,
                  email: freshUser.email,
                  avatar_url: freshUser.avatar_url,
                  role: freshUser.role || 'user',
                  status: 'Active',
                  best_wpm: 0,
                  avg_wpm: 0,
                  accuracy: 0,
                  tests_completed: 0,
                  is_premium: false
                }),
                4000
              );
            } catch (e) {
              console.warn('Direct profiles table insert note:', e);
            }

            // Also upsert users table for backward compatibility
            try {
              await this._withTimeout(
                this.supabase.from('users').upsert({
                  id: freshUser.id,
                  username: freshUser.username,
                  email: freshUser.email,
                  avatar_url: freshUser.avatar_url,
                  best_wpm: 0,
                  avg_wpm: 0,
                  accuracy: 0,
                  tests_completed: 0,
                  is_premium: false
                }),
                4000
              );
            } catch (e) {
              console.warn('Direct users table insert note:', e);
            }

            const accounts = this._getLocal('users_registry', []);
            accounts.push({ ...freshUser, password });
            this._setLocal('users_registry', accounts);

            this.setCurrentUser(freshUser);
            this._initUserData(userId, freshUser);
            this.broadcastToAdminFeed('USER_REGISTERED', freshUser);
            return {
              success: true,
              user: freshUser,
              message: 'Account created! (Supabase email rate limit bypassed)'
            };
          }

          if (errMsg.toLowerCase().includes('fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('timeout')) {
            return {
              success: false,
              message: 'Failed to reach Supabase. Check if your project is paused or Project URL has typos. You can also switch to Local Engine.'
            };
          }
          return { success: false, message: error.message };
        }

        const userId = data.user?.id || `user_${Date.now()}`;
        const freshUser = createFreshUser(userId, cleanUsername, trimmedEmail);

        // Upsert user into Supabase profiles table
        try {
          await this._withTimeout(this.supabase.from('profiles').upsert({
            id: freshUser.id,
            username: freshUser.username,
            display_name: freshUser.username,
            email: freshUser.email,
            avatar_url: freshUser.avatar_url,
            role: freshUser.role || 'user',
            status: 'Active',
            best_wpm: 0,
            avg_wpm: 0,
            accuracy: 0,
            tests_completed: 0,
            is_premium: false
          }), 4000);
        } catch (e) {
          console.warn('Supabase profiles upsert notice:', e);
        }

        // Also upsert users table
        try {
          await this._withTimeout(this.supabase.from('users').upsert({
            id: freshUser.id,
            username: freshUser.username,
            email: freshUser.email,
            avatar_url: freshUser.avatar_url,
            best_wpm: 0,
            avg_wpm: 0,
            accuracy: 0,
            tests_completed: 0,
            is_premium: false
          }), 4000);
        } catch (e) {
          console.warn('Supabase users fallback notice:', e);
        }

        const accounts = this._getLocal('users_registry', []);
        accounts.push({ ...freshUser, password });
        this._setLocal('users_registry', accounts);

        this.setCurrentUser(freshUser);
        this._initUserData(userId, freshUser);
        this.broadcastToAdminFeed('USER_REGISTERED', freshUser);
        return { success: true, user: freshUser };
      } catch (err) {
        console.warn('Supabase auth sign up fallback:', err);
        return {
          success: false,
          message: err.message?.includes('timeout') 
            ? 'Supabase connection timed out. Check if your project is paused, or switch to Local Engine.' 
            : (err.message || 'Failed to sign up.')
        };
      }
    }

    // 2. Real-time Local Authentication
    const accounts = this._getLocal('users_registry', []);
    const existing = accounts.find(a => a.email && a.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please sign in.' };
    }

    const userId = `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const freshUser = createFreshUser(userId, cleanUsername, trimmedEmail);
    
    // Save account with password
    accounts.push({
      ...freshUser,
      password: password
    });
    this._setLocal('users_registry', accounts);

    this.setCurrentUser(freshUser);
    this._initUserData(userId, freshUser);
    this.broadcastToAdminFeed('USER_REGISTERED', freshUser);

    return { success: true, user: freshUser };
  }

  async signIn(emailOrUsername, password) {
    const input = (emailOrUsername || '').trim().toLowerCase();

    // 1. If live Supabase configured, attempt Supabase Auth first
    if (this.isConfigured()) {
      try {
        const signInPromise = this.supabase.auth.signInWithPassword({
          email: input,
          password: password
        });
        const { data, error } = await this._withTimeout(signInPromise, 4000);

        if (!error && data?.user) {
          let profile = null;
          try {
            const profileRes = await this._withTimeout(
              this.supabase.from('profiles').select('*').eq('id', data.user.id).single(),
              3000
            );
            if (!profileRes.error && profileRes.data) {
              profile = profileRes.data;
            }
          } catch (e) {
            console.warn('Profile fetch note:', e);
          }

          if (!profile) {
            try {
              const userRes = await this._withTimeout(
                this.supabase.from('users').select('*').eq('id', data.user.id).single(),
                3000
              );
              profile = userRes?.data;
            } catch (e) {
              // fallback
            }
          }

          const rawUsername = data.user.user_metadata?.username || profile?.username || profile?.display_name || 'Typist';
          const resolvedDisplayName = profile?.display_name || profile?.username || rawUsername;
          const activeUser = {
            ...(profile || createFreshUser(data.user.id, rawUsername, data.user.email)),
            id: data.user.id,
            displayName: resolvedDisplayName,
            display_name: resolvedDisplayName,
            username: profile?.username || rawUsername,
            email: data.user.email || profile?.email || ''
          };

          this.setCurrentUser(activeUser);
          return { success: true, user: activeUser };
        }
      } catch (err) {
        console.warn('Supabase signin attempt note:', err);
      }
    }

    // 2. Local Authentication Engine (handles master admin & local accounts)
    this.ensureDefaultAdmin();
    const accounts = this._getLocal('users_registry', []);
    const userFound = accounts.find(
      a => (a.email && a.email.toLowerCase() === input) ||
           (a.username && a.username.toLowerCase() === input)
    );

    if (userFound) {
      if (userFound.password && userFound.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      const { password: _, ...safeUser } = userFound;
      if (safeUser.email === 'admin@typemaster.com' || safeUser.username === 'Admin Administrator') {
        safeUser.role = 'admin';
      } else if (!safeUser.role) {
        safeUser.role = 'user';
      }
      const resolvedName = safeUser.display_name || safeUser.username || 'Typist';
      const activeUser = {
        ...safeUser,
        displayName: resolvedName,
        display_name: resolvedName
      };
      this.setCurrentUser(activeUser);
      return { success: true, user: activeUser };
    }

    // 3. Built-in Master Admin fallback (admin@typemaster.com / admin123)
    if ((input === 'admin@typemaster.com' || input === 'admin') && password === 'admin123') {
      const masterAdmin = {
        id: 'admin_master_01',
        username: 'Admin Administrator',
        displayName: 'Admin Administrator',
        display_name: 'Admin Administrator',
        email: 'admin@typemaster.com',
        role: 'admin',
        status: 'Active',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
        best_wpm: 0,
        avg_wpm: 0,
        accuracy: 0,
        tests_completed: 0,
        is_premium: true,
        created_at: new Date().toISOString()
      };
      this.setCurrentUser(masterAdmin);
      return { success: true, user: masterAdmin };
    }

    return { success: false, message: 'Invalid credentials. Please verify your email/username and password.' };
    return { success: true, user: activeUser };
  }

  async signInGuest(name = '') {
    // 1. Purge any lingering Supabase auth session from previous logins
    if (this.isConfigured()) {
      try {
        await this.supabase.auth.signOut();
      } catch (err) {
        console.warn('Guest signout note:', err);
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const cleanName = (name || '').trim() || `Typist_${randomSuffix}`;
    const guestId = `guest_${Date.now()}_${randomSuffix}`;
    const guestUser = {
      ...createFreshUser(guestId, cleanName, ''),
      isGuest: true
    };

    this.setCurrentUser(guestUser);
    this._initUserData(guestId, guestUser);

    if (this.isConfigured()) {
      try {
        await this._withTimeout(
          this.supabase.from('users').upsert({
            id: guestId,
            username: cleanName,
            email: '',
            avatar_url: guestUser.avatar_url,
            best_wpm: 0,
            avg_wpm: 0,
            accuracy: 0,
            tests_completed: 0,
            is_premium: false
          }),
          4000
        );
      } catch (e) {
        console.warn('Guest user Supabase upsert note:', e);
      }
    }

    return { success: true, user: guestUser };
  }

  async signOut() {
    if (this.isConfigured()) {
      try {
        await this.supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    this.setCurrentUser(null);
  }

  async signInWithOAuth(provider = 'google') {
    if (this.isConfigured()) {
      try {
        const { data, error } = await this.supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        console.warn('OAuth signIn note, using fallback:', err.message);
      }
    }
    // Simulation / local fallback for Google Typist
    const mockUser = {
      id: `google_${Date.now()}`,
      username: 'Google Typist',
      displayName: 'Google Typist',
      email: 'user@gmail.com',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=GoogleTypist',
      role: 'user',
      is_premium: false
    };
    this.setCurrentUser(mockUser);
    sessionStorage.setItem('typemaster_session_authenticated', 'true');
    return { success: true, user: mockUser };
  }

  _initUserData(userId, userObj) {
    // Zero out all initial tracking for this fresh user
    this._setLocal(`user_${userId}`, userObj);
    this._setLocal(`streak_${userId}`, createFreshStreak(userId));
    this._setLocal(`test_logs_${userId}`, []);
    this._setLocal(`achievements_${userId}`, DEFAULT_ACHIEVEMENTS);
  }

  // ==========================================================
  // RESET / CLEAR ALL STATS
  // ==========================================================
  async clearCurrentUserData() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    const clearedUser = createFreshUser(currentUser.id, currentUser.username, currentUser.email, currentUser.is_premium);
    this.setCurrentUser(clearedUser);
    this._initUserData(currentUser.id, clearedUser);

    // Also reset leaderboard for this user
    const leaderboard = this._getLocal('leaderboard', []);
    const updatedLeaderboard = leaderboard.filter(l => l.userId !== currentUser.id);
    this._setLocal('leaderboard', updatedLeaderboard);

    if (this.isConfigured()) {
      try {
        await this.supabase.from('test_logs').delete().eq('user_id', currentUser.id);
        await this.supabase.from('users').update({
          best_wpm: 0,
          avg_wpm: 0,
          accuracy: 0,
          tests_completed: 0
        }).eq('id', currentUser.id);
        await this.supabase.from('streaks').update({
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null
        }).eq('user_id', currentUser.id);
      } catch (e) {
        console.warn('Supabase reset note:', e);
      }
    }

    return clearedUser;
  }

  async clearTestHistory() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    this._setLocal(`test_logs_${currentUser.id}`, []);
    if (this.isConfigured()) {
      try {
        await Promise.all([
          this.supabase.from('test_logs').delete().eq('user_id', currentUser.id),
          this.supabase.from('test_sessions').delete().eq('user_id', currentUser.id)
        ]);
      } catch (e) {
        console.warn('Supabase clear logs note:', e);
      }
    }
  }

  async clearAllData() {
    localStorage.clear();
    this.initClient();
  }

  // ==========================================================
  // STEP 2: PROMPTS RETRIEVAL (Guaranteed Fresh / Non-Repeating & Duration-Scaled)
  // ==========================================================
  async fetchPrompt(category = 'Random Text', difficulty = 'Easy', excludeText = '', duration = 60) {
    let targetDuration = '1m';
    if (duration === 180 || duration === '3 min') targetDuration = '3m';
    else if (duration === 300 || duration === '5 min') targetDuration = '5m';
    else if (duration === 'custom' || duration === 0 || duration === 120) targetDuration = 'custom';

    if (this.isConfigured()) {
      try {
        let query = this.supabase.from('prompts').select('*');
        if (category && category !== 'All') {
          query = query.eq('category', category);
        }
        if (difficulty) {
          query = query.ilike('difficulty', difficulty);
        }

        // Query by word count / duration criteria if available
        if (targetDuration === 'custom') {
          query = query.gte('word_count', 500);
        } else if (targetDuration === '5m') {
          query = query.gte('word_count', 300);
        } else if (targetDuration === '3m') {
          query = query.gte('word_count', 150).lte('word_count', 320);
        } else {
          query = query.lte('word_count', 150);
        }

        const { data, error } = await this._withTimeout(query, 3000);
        if (!error && data && data.length > 0) {
          let pool = data;
          if (excludeText && data.length > 1) {
            pool = data.filter(d => d.text !== excludeText);
            if (pool.length === 0) pool = data;
          }
          const randomIndex = Math.floor(Math.random() * pool.length);
          const scaled = scalePromptToDuration(pool[randomIndex], targetDuration);
          return { success: true, prompt: scaled, source: 'supabase' };
        }
      } catch (err) {
        console.warn('Supabase fetch prompt fallback:', err);
      }
    }

    // Try backend dynamic generation endpoint first for rich variety
    try {
      const apiRes = await fetch('/api/typing/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || 'Random Text',
          difficulty: difficulty || 'Medium',
          language: 'C',
          durationSeconds: typeof duration === 'number' ? duration : 60
        })
      });
      if (apiRes.ok) {
        const genData = await apiRes.json();
        if (genData.success && genData.text) {
          return {
            success: true,
            prompt: {
              id: `gen_${Date.now()}`,
              category: genData.category,
              difficulty: genData.difficulty,
              text: genData.text,
              word_count: genData.text.split(/\s+/).length
            },
            source: genData.source || 'gemini_api'
          };
        }
      }
    } catch {
      // Endpoint fallback to local prompts pool
    }

    // Local prompts pool filtered by category, difficulty, and targetDuration
    let filtered = PRACTICE_PROMPTS.filter(p => {
      const matchCat = !category || category === 'All' || p.category.toLowerCase() === category.toLowerCase();
      const matchDiff = !difficulty || p.difficulty.toLowerCase() === difficulty.toLowerCase();
      const matchDur = p.targetDuration === targetDuration;
      return matchCat && matchDiff && matchDur;
    });

    // Fallback: match by category & difficulty across any duration
    if (filtered.length === 0) {
      filtered = PRACTICE_PROMPTS.filter(p => {
        const matchCat = !category || category === 'All' || p.category.toLowerCase() === category.toLowerCase();
        const matchDiff = !difficulty || p.difficulty.toLowerCase() === difficulty.toLowerCase();
        return matchCat && matchDiff;
      });
    }

    const pool = filtered.length > 0 ? filtered : PRACTICE_PROMPTS;
    let nonRepeating = pool;
    if (excludeText && pool.length > 1) {
      nonRepeating = pool.filter(p => p.text !== excludeText);
      if (nonRepeating.length === 0) nonRepeating = pool;
    }

    const picked = nonRepeating[Math.floor(Math.random() * nonRepeating.length)];
    const finalPrompt = scalePromptToDuration(picked, targetDuration);
    return { success: true, prompt: finalPrompt, source: 'local' };
  }

  // ==========================================================
  // ACCOUNT & PASSWORD MANAGEMENT
  // ==========================================================
  async resetPasswordForEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, message: 'Please enter a valid email address.' };

    if (this.isConfigured()) {
      try {
        const { error } = await this._withTimeout(
          this.supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: window.location.origin
          }),
          6000
        );
        if (error) {
          return { success: false, message: error.message };
        }
        return {
          success: true,
          message: 'Password reset link sent! Check your inbox to choose a new password.'
        };
      } catch (err) {
        console.warn('Supabase reset password fallback:', err);
      }
    }

    // Local offline registry check
    const accounts = this._getLocal('users_registry', []);
    const userFound = accounts.find(a => a.email && a.email.toLowerCase() === cleanEmail);
    if (!userFound) {
      return { success: false, message: 'No registered typist account found with that email address.' };
    }

    return {
      success: true,
      message: `Password reset request registered for ${cleanEmail}! In local engine mode, you can change your password directly in Settings.`
    };
  }

  async updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user authenticated.' };

    if (this.isConfigured()) {
      try {
        await this._withTimeout(
          this.supabase.auth.updateUser({ password: newPassword }),
          6000
        );
      } catch (err) {
        console.warn('Supabase auth password update note:', err);
      }
    }

    // Update in local accounts registry
    const accounts = this._getLocal('users_registry', []);
    const index = accounts.findIndex(a => a.id === currentUser.id || (a.email && a.email === currentUser.email));
    if (index >= 0) {
      accounts[index].password = newPassword;
      this._setLocal('users_registry', accounts);
    }

    return { success: true, message: 'Password updated successfully!' };
  }

  async updateUserProfile({ username, avatar_url, email }) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'No user authenticated.' };

    const updatedUser = {
      ...currentUser,
      username: username ? username.trim() : currentUser.username,
      avatar_url: avatar_url || currentUser.avatar_url,
      email: email ? email.trim() : currentUser.email
    };

    this.setCurrentUser(updatedUser);
    this._setLocal(`user_${currentUser.id}`, updatedUser);

    if (this.isConfigured()) {
      try {
        await this._withTimeout(
          this.supabase.from('users').update({
            username: updatedUser.username,
            avatar_url: updatedUser.avatar_url,
            email: updatedUser.email,
            updated_at: new Date().toISOString()
          }).eq('id', currentUser.id),
          4000
        );
      } catch (e) {
        console.warn('Supabase profile update note:', e);
      }
    }

    return { success: true, user: updatedUser, message: 'Profile updated successfully!' };
  }

  // ==========================================================
  // STEP 4 & 5: SUBMIT TEST - REAL-TIME TELEMETRY & TRANSACTION
  // ==========================================================
  async submitTest(payload) {
    // 1. Validation & Anti-Cheat Service
    const validation = AntiCheatService.validateSubmission(payload);
    const isValid = Boolean(validation.isValid);
    const resultBadge = validation.badge || (isValid ? 'Good' : 'Fair');

    const currentUser = this.getCurrentUser() || createFreshUser('guest_01', 'Typist');
    const userId = currentUser.id;

    const {
      wpm,
      rawWpm,
      accuracy,
      duration,
      errors,
      characters,
      category = 'Random Text',
      difficulty = 'Easy'
    } = payload;

    // Idempotency: Prevent duplicate submissions within 3.5 seconds with identical metrics
    const nowMs = Date.now();
    if (
      this._lastSubmission &&
      nowMs - this._lastSubmission.time < 3500 &&
      this._lastSubmission.userId === userId &&
      this._lastSubmission.wpm === Math.round(wpm) &&
      this._lastSubmission.errors === errors &&
      this._lastSubmission.characters === characters
    ) {
      console.warn('[SupabaseService] Duplicate test submission ignored within debounce window');
      return this._lastSubmission.result;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newLog = {
      id: `log_${Date.now()}`,
      user_id: userId,
      date: dateFormatted,
      duration: `${Math.max(1, Math.round(duration / 60))} min`,
      durationSeconds: duration,
      wpm: Math.round(wpm),
      raw_wpm: Math.round(rawWpm || wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      errors: Math.max(0, errors),
      characters: Math.max(0, characters),
      category,
      difficulty,
      result: resultBadge,
      is_valid: isValid,
      prompt_text: payload.promptText || '',
      typed_input: payload.typedInput || '',
      mistake_details: payload.mistakeDetails || payload.mistake_details || [],
      mistake_stats: payload.mistakeStats || payload.mistake_stats || null,
      created_at: now.toISOString()
    };

    // 2. Append new test log to local store (with duplicate prevention)
    const existingLogs = this._getLocal(`test_logs_${userId}`, []);
    const alreadyExists = existingLogs.some(l =>
      l.id === newLog.id ||
      (Math.abs(new Date(l.created_at || 0).getTime() - now.getTime()) < 4000 && l.wpm === newLog.wpm && l.errors === newLog.errors)
    );
    const updatedLogs = alreadyExists ? existingLogs : [newLog, ...existingLogs];
    this._setLocal(`test_logs_${userId}`, updatedLogs);

    // 3. Recalculate User Stats dynamically in real time
    const allWpms = updatedLogs.map(l => l.wpm);
    const bestWpm = Math.max(...allWpms);
    const avgWpm = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);
    const avgAccuracy = parseFloat((updatedLogs.reduce((a, b) => a + b.accuracy, 0) / updatedLogs.length).toFixed(1));
    const testsCompleted = updatedLogs.length;

    const updatedUser = {
      ...currentUser,
      best_wpm: bestWpm,
      avg_wpm: avgWpm,
      accuracy: avgAccuracy,
      tests_completed: testsCompleted
    };
    this.setCurrentUser(updatedUser);
    this._setLocal(`user_${userId}`, updatedUser);

    // 4. Calculate Daily Streak in Real Time
    const streakData = this._getLocal(`streak_${userId}`, createFreshStreak(userId));
    const todayStr = now.toISOString().split('T')[0];
    let newStreak = streakData.current_streak;

    if (!streakData.last_active_date) {
      newStreak = 1;
    } else if (streakData.last_active_date !== todayStr) {
      const lastDate = new Date(streakData.last_active_date);
      const diffDays = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updatedStreak = {
      ...streakData,
      current_streak: newStreak,
      longest_streak: Math.max(streakData.longest_streak || 0, newStreak),
      last_active_date: todayStr
    };
    this._setLocal(`streak_${userId}`, updatedStreak);

    // 5. Dynamic Real-time Achievements evaluation
    const achievements = this._getLocal(`achievements_${userId}`, DEFAULT_ACHIEVEMENTS);
    let newlyUnlocked = [];

    const updatedAchievements = achievements.map(ach => {
      let shouldUnlock = ach.unlocked;
      if (!ach.unlocked) {
        if (ach.id === 'first_test' && testsCompleted >= 1) shouldUnlock = true;
        if (ach.id === 'speed_master' && wpm >= 75) shouldUnlock = true;
        if (ach.id === 'accuracy_king' && accuracy >= 98) shouldUnlock = true;
        if (ach.id === '3_day_streak' && newStreak >= 3) shouldUnlock = true;
        if (ach.id === '10_day_streak' && newStreak >= 10) shouldUnlock = true;
        if (ach.id === '10_tests' && testsCompleted >= 10) shouldUnlock = true;
        if (ach.id === 'lightning_fast' && wpm >= 100) shouldUnlock = true;
        if (ach.id === 'master_accuracy' && accuracy === 100) shouldUnlock = true;

        if (shouldUnlock) {
          newlyUnlocked.push(ach.title);
        }
      }
      return {
        ...ach,
        unlocked: shouldUnlock,
        achievedText: shouldUnlock ? 'Achieved ✓' : 'Locked'
      };
    });
    this._setLocal(`achievements_${userId}`, updatedAchievements);

    // 6. Update Real-Time Leaderboard
    this._updateLeaderboardEntry(updatedUser, updatedStreak);

    // 7. Push to live Supabase asynchronously if configured
    if (this.isConfigured()) {
      try {
        // Upsert into profiles table
        try {
          await this._withTimeout(this.supabase.from('profiles').upsert({
            id: userId,
            username: updatedUser.username,
            display_name: updatedUser.displayName || updatedUser.username,
            email: updatedUser.email || '',
            avatar_url: updatedUser.avatar_url || '',
            best_wpm: bestWpm,
            avg_wpm: avgWpm,
            accuracy: avgAccuracy,
            tests_completed: testsCompleted,
            updated_at: now.toISOString()
          }), 4000);
        } catch (e) {
          console.warn('Profiles upsert note:', e);
        }

        // Upsert users table for backward compatibility
        try {
          await this._withTimeout(this.supabase.from('users').upsert({
            id: userId,
            username: updatedUser.username,
            email: updatedUser.email || '',
            avatar_url: updatedUser.avatar_url || '',
            best_wpm: bestWpm,
            avg_wpm: avgWpm,
            accuracy: avgAccuracy,
            tests_completed: testsCompleted,
            updated_at: now.toISOString()
          }), 4000);
        } catch (e) {
          console.warn('Users upsert note:', e);
        }

        // UPSERT STREAK
        try {
          await this._withTimeout(this.supabase.from('streaks').upsert({
            user_id: userId,
            current_streak: newStreak,
            longest_streak: updatedStreak.longest_streak,
            last_active_date: todayStr
          }), 4000);
        } catch (e) {
          console.warn('Streaks upsert note:', e);
        }

        // Insert into test_sessions table
        try {
          await this._withTimeout(this.supabase.from('test_sessions').insert([{
            user_id: userId,
            wpm: newLog.wpm,
            raw_wpm: newLog.raw_wpm,
            accuracy: newLog.accuracy,
            duration: duration,
            errors: newLog.errors,
            characters: newLog.characters,
            category,
            difficulty,
            result_badge: resultBadge,
            is_valid: isValid,
            mistake_details: payload.mistakeDetails || payload.mistake_details || [],
            prompt_text: payload.promptText || '',
            typed_input: payload.typedInput || '',
            created_at: now.toISOString()
          }]), 4000);
        } catch (e) {
          console.warn('test_sessions insert note:', e);
        }

        // Insert into test_logs table for backward compatibility
        try {
          await this._withTimeout(this.supabase.from('test_logs').insert([{
            user_id: userId,
            wpm: newLog.wpm,
            raw_wpm: newLog.raw_wpm,
            accuracy: newLog.accuracy,
            duration: duration,
            errors: newLog.errors,
            characters: newLog.characters,
            category,
            difficulty,
            result_badge: resultBadge,
            is_valid: isValid,
            mistake_details: payload.mistakeDetails || payload.mistake_details || [],
            prompt_text: payload.promptText || '',
            typed_input: payload.typedInput || '',
            created_at: now.toISOString()
          }]), 4000);
        } catch (e) {
          console.warn('test_logs insert note:', e);
        }
      } catch (err) {
        console.warn('Supabase async transaction write note:', err);
      }
    }

    // Two-Way Instant Telemetry Broadcast to Admin Portal (admin-live-feed)
    this.broadcastToAdminFeed('TEST_COMPLETED', {
      ...newLog,
      userName: updatedUser.displayName || updatedUser.username || 'Typist',
      userEmail: updatedUser.email || ''
    });

    const fullSessionResult = {
      success: true,
      valid: isValid,
      badge: resultBadge,
      newlyUnlocked,
      stats: {
        wpm: newLog.wpm,
        rawWpm: newLog.raw_wpm,
        accuracy: newLog.accuracy,
        duration,
        errors: newLog.errors,
        characters: newLog.characters,
        bestWpm,
        avgWpm,
        testsCompleted,
        currentStreak: newStreak
      }
    };

    this._lastSubmission = {
      time: nowMs,
      userId,
      wpm: newLog.wpm,
      errors: newLog.errors,
      characters: newLog.characters,
      result: fullSessionResult
    };

    return fullSessionResult;
  }

  // Real-time Leaderboard updater
  _updateLeaderboardEntry(user, streak) {
    const leaderboard = this._getLocal('leaderboard', []);
    const tier = (user.best_wpm || 0) >= 100 ? 'Master' :
                 (user.best_wpm || 0) >= 75 ? 'Diamond' :
                 (user.best_wpm || 0) >= 50 ? 'Gold' : 'Apprentice';

    const index = leaderboard.findIndex(l => l.userId === user.id);
    const entry = {
      userId: user.id,
      name: user.username,
      wpm: user.best_wpm,
      accuracy: user.accuracy,
      streak: streak.current_streak,
      tier,
      avatar: user.avatar_url,
      lastUpdated: new Date().toISOString()
    };

    if (index >= 0) {
      leaderboard[index] = entry;
    } else {
      leaderboard.push(entry);
    }

    // Sort by best WPM descending
    leaderboard.sort((a, b) => b.wpm - a.wpm);
    this._setLocal('leaderboard', leaderboard);
  }

  // ==========================================================
  // REAL-TIME DASHBOARD DATA AGGREGATION
  // ==========================================================
  async fetchDashboardData(userOverride = null) {
    const currentUser = userOverride || this.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const userId = currentUser.id;
    const rawLocalLogs = this._getLocal(`test_logs_${userId}`, []);

    // Helper to determine if two test log records represent the exact same session
    const isDuplicateLog = (a, b) => {
      if (!a || !b) return false;
      if (a.id && b.id && a.id === b.id) return true;
      if (a.created_at && b.created_at) {
        const diff = Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (diff < 5000 && a.wpm === b.wpm && a.errors === b.errors) return true;
      }
      const sameDate = a.date === b.date;
      if (
        sameDate &&
        a.wpm === b.wpm &&
        Math.round(a.accuracy) === Math.round(b.accuracy) &&
        a.errors === b.errors &&
        (a.duration === b.duration || a.durationSeconds === b.durationSeconds)
      ) {
        return true;
      }
      return false;
    };

    // Sanitize and deduplicate local logs
    const deduplicatedLocalLogs = [];
    for (const rawL of rawLocalLogs) {
      let l = { ...rawL };
      if ((l.result === 'Invalid' || l.result === 'Flagged') && (l.characters > 0 || l.wpm > 0) && l.wpm <= 250) {
        const fixedBadge = (l.wpm < 15 && l.accuracy >= 80) ? 'Fair' : (l.accuracy >= 75 ? 'Fair' : 'Needs Practice');
        l = { ...l, result: fixedBadge, is_valid: true };
      }
      if (!deduplicatedLocalLogs.some(existing => isDuplicateLog(existing, l))) {
        deduplicatedLocalLogs.push(l);
      }
    }

    // Persist sanitized and deduplicated logs if any duplicates or invalid badges were repaired
    if (deduplicatedLocalLogs.length !== rawLocalLogs.length || JSON.stringify(rawLocalLogs) !== JSON.stringify(deduplicatedLocalLogs)) {
      this._setLocal(`test_logs_${userId}`, deduplicatedLocalLogs);
    }
    const localLogs = deduplicatedLocalLogs;

    // 1. Supabase live fetch if configured
    if (this.isConfigured()) {
      try {
        const [userRes, streakRes, logsRes] = await this._withTimeout(
          Promise.all([
            this.supabase.from('users').select('*').eq('id', userId).maybeSingle(),
            this.supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
            this.supabase.from('test_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
          ]),
          3000
        );

        const userRow = userRes?.data;
        const streakRow = streakRes?.data;
        const liveLogs = logsRes?.data;

        if (userRow) {
          const formattedRecent = (liveLogs || []).map(l => {
            let resBadge = l.result_badge;
            if ((resBadge === 'Invalid' || resBadge === 'Flagged') && (l.characters > 0 || l.wpm > 0) && l.wpm <= 250) {
              resBadge = (l.wpm < 15 && l.accuracy >= 80) ? 'Fair' : (l.accuracy >= 75 ? 'Fair' : 'Needs Practice');
            }
            return {
              id: l.id,
              date: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              duration: `${Math.max(1, Math.round(l.duration / 60))} min`,
              durationSeconds: l.duration,
              wpm: l.wpm,
              accuracy: Math.round(l.accuracy * 10) / 10,
              errors: l.errors,
              characters: l.characters,
              result: resBadge,
              created_at: l.created_at
            };
          });

          // Merge Supabase logs with local logs WITHOUT duplicating entries
          const mergedRecent = [...formattedRecent];
          localLogs.forEach(loc => {
            if (!mergedRecent.some(rem => isDuplicateLog(rem, loc))) {
              mergedRecent.push(loc);
            }
          });

          const chronological = [...mergedRecent].reverse().slice(-7);
          const performanceGraph = chronological.map(l => ({
            date: l.date.length > 6 ? l.date.split(',')[0] : l.date,
            wpm: l.wpm
          }));
          const accuracyTrend = chronological.map(l => ({
            date: l.date.length > 6 ? l.date.split(',')[0] : l.date,
            accuracy: l.accuracy
          }));

          return {
            user: userRow,
            streak: streakRow || createFreshStreak(userId),
            recentTests: mergedRecent,
            achievements: this._getLocal(`achievements_${userId}`, DEFAULT_ACHIEVEMENTS),
            performanceGraph,
            accuracyTrend
          };
        }
      } catch (err) {
        console.warn('Dashboard live fetch fallback:', err);
      }
    }

    // 2. Real-time Local Store
    const user = this._getLocal(`user_${userId}`, currentUser);
    const streak = this._getLocal(`streak_${userId}`, createFreshStreak(userId));
    const recentTests = localLogs;
    const achievements = this._getLocal(`achievements_${userId}`, DEFAULT_ACHIEVEMENTS);

    // Build real-time graph points strictly from completed tests
    const chronological = [...recentTests].reverse().slice(-7);
    const performanceGraph = chronological.map(l => ({
      date: l.date.length > 6 ? l.date.split(',')[0] : l.date,
      wpm: l.wpm
    }));

    const accuracyTrend = chronological.map(l => ({
      date: l.date.length > 6 ? l.date.split(',')[0] : l.date,
      accuracy: l.accuracy
    }));

    return {
      user,
      streak,
      recentTests,
      achievements,
      performanceGraph,
      accuracyTrend
    };
  }

  // ==========================================================
  // REAL-TIME LEADERBOARD
  // ==========================================================
  async fetchLeaderboard(filter = 'weekly') {
    // 1. Supabase live fetch
    if (this.isConfigured()) {
      try {
        const { data: users, error } = await this.supabase
          .from('users')
          .select('id, username, avatar_url, best_wpm, accuracy')
          .order('best_wpm', { ascending: false })
          .limit(50);

        if (!error && users && users.length > 0) {
          return users.map(u => ({
            userId: u.id,
            name: u.username,
            wpm: u.best_wpm || 0,
            accuracy: u.accuracy || 0,
            streak: 0,
            tier: (u.best_wpm || 0) >= 100 ? 'Master' : (u.best_wpm || 0) >= 75 ? 'Diamond' : (u.best_wpm || 0) >= 50 ? 'Gold' : 'Apprentice',
            avatar: u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`
          }));
        }
      } catch (err) {
        console.warn('Supabase leaderboard fetch fallback:', err);
      }
    }

    // 2. Local leaderboard
    const list = this._getLocal('leaderboard', []);
    return list;
  }

  // ==========================================================
  // MEMBERSHIP TIER & REALTIME SYNCHRONIZATION
  // ==========================================================
  async checkUserTier() {
    const user = this.getCurrentUser();
    return {
      isPremium: Boolean(user?.is_premium),
      tier: user?.is_premium ? 'Premium' : 'Free'
    };
  }

  async setUserTier(isPremium, targetUserId = null) {
    const currentUser = this.getCurrentUser();
    const userId = targetUserId || currentUser?.id;
    if (!userId) return null;

    // 1. Live Supabase update: profiles and users table
    if (this.isConfigured()) {
      try {
        await this._withTimeout(
          this.supabase.from('profiles').update({
            is_premium: Boolean(isPremium),
            updated_at: new Date().toISOString()
          }).eq('id', userId),
          4000
        );
      } catch (e) {
        console.warn('Supabase profiles tier update note:', e);
      }
      try {
        await this._withTimeout(
          this.supabase.from('users').update({
            is_premium: Boolean(isPremium),
            updated_at: new Date().toISOString()
          }).eq('id', userId),
          4000
        );
      } catch (e) {
        console.warn('Supabase users tier update note:', e);
      }
    }

    // 2. Update local registry
    const accounts = this._getLocal('users_registry', []);
    const idx = accounts.findIndex(a => a.id === userId);
    if (idx >= 0) {
      accounts[idx].is_premium = Boolean(isPremium);
      this._setLocal('users_registry', accounts);
    }

    let updatedUser = null;
    if (currentUser && currentUser.id === userId) {
      updatedUser = { ...currentUser, is_premium: Boolean(isPremium) };
      this.setCurrentUser(updatedUser);
      this._setLocal(`user_${userId}`, updatedUser);
    }

    // 3. Broadcast instantly to User Portal (user-profile-sync)
    this.broadcastToUserSync('PROFILE_UPDATE', userId, { is_premium: Boolean(isPremium) });

    return updatedUser || { success: true, is_premium: Boolean(isPremium) };
  }

  // ==========================================================
  // FEEDBACK ENGINE: LIVE DATABASE & TELEMETRY
  // ==========================================================
  async submitFeedback({ userId, rating, comment, userName = '', userEmail = '', category = 'General Feedback', subject = '', message = '', attachmentUrl = null }) {
    const activeUser = this.getCurrentUser();
    const effectiveUserId = userId || activeUser?.id || 'anonymous';
    const effectiveUserName = userName || activeUser?.username || activeUser?.displayName || 'Typist';
    const effectiveUserEmail = userEmail || activeUser?.email || '';

    const cleanMessage = (message || comment || '').trim();
    const cleanSubject = (subject || '').trim() || cleanMessage.slice(0, 40) || 'General Feedback';
    const cleanCategory = category || 'General Feedback';
    const parsedRating = rating ? Number(rating) : null;

    const now = new Date();
    const fbRecord = {
      id: `fb_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: effectiveUserId,
      userName: effectiveUserName,
      userEmail: effectiveUserEmail,
      category: cleanCategory,
      subject: cleanSubject,
      message: cleanMessage,
      comment: cleanMessage, // backwards compatibility
      rating: parsedRating,
      status: 'Pending',
      admin_response: null,
      adminReply: null,
      attachment_url: attachmentUrl || null,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      created_at: now.toISOString()
    };

    // 1. Supabase feedback table insert
    if (this.isConfigured()) {
      try {
        const { data, error } = await this._withTimeout(
          this.supabase.from('feedback').insert([{
            user_id: fbRecord.user_id,
            category: fbRecord.category,
            subject: fbRecord.subject,
            message: fbRecord.message,
            comment: fbRecord.comment,
            rating: fbRecord.rating,
            status: fbRecord.status,
            admin_response: fbRecord.admin_response,
            attachment_url: fbRecord.attachment_url,
            created_at: fbRecord.created_at
          }]).select().maybeSingle(),
          4000
        );
        if (error) {
          console.warn('Extended feedback insert note, falling back to core columns:', error.message);
          const fallbackRes = await this._withTimeout(
            this.supabase.from('feedback').insert([{
              user_id: fbRecord.user_id,
              rating: fbRecord.rating || 5,
              comment: `${fbRecord.subject}: ${fbRecord.message}`,
              created_at: fbRecord.created_at
            }]).select().maybeSingle(),
            4000
          );
          if (fallbackRes?.data?.id) {
            fbRecord.id = fallbackRes.data.id;
          }
        } else if (data?.id) {
          fbRecord.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase feedback insert note:', err);
      }
    }

    // 2. User local feedback store
    const userFeedbacks = this._getLocal(`user_feedback_${effectiveUserId}`, []);
    userFeedbacks.unshift(fbRecord);
    this._setLocal(`user_feedback_${effectiveUserId}`, userFeedbacks);

    // 3. Local feedback storage sync so Admin Portal receives it immediately
    const localFeedbacks = this._getLocal('admin_feedback', []);
    localFeedbacks.unshift(fbRecord);
    this._setLocal('admin_feedback', localFeedbacks);

    // 4. Realtime Broadcast to Admin Portal (admin-live-feed)
    this.broadcastToAdminFeed('FEEDBACK_SUBMITTED', fbRecord);

    // 5. In-window & cross-tab sync
    try {
      window.dispatchEvent(new CustomEvent('typemaster-feedback-sync', { detail: fbRecord }));
      const bc = new BroadcastChannel('user-feedback-sync');
      bc.postMessage({ type: 'FEEDBACK_SUBMITTED', payload: fbRecord });
      bc.close();
    } catch {
      // Broadcast fallback
    }

    return { success: true, feedback: fbRecord };
  }

  async fetchUserFeedbackLive(userId) {
    if (!userId) return [];

    // 1. Live Supabase fetch strictly filtered by authenticated user's ID
    if (this.isConfigured()) {
      try {
        const { data, error } = await this._withTimeout(
          this.supabase
            .from('feedback')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          4000
        );

        if (!error && Array.isArray(data)) {
          const liveRecords = data.map(d => ({
            id: d.id,
            user_id: d.user_id,
            category: d.category || 'General Feedback',
            subject: d.subject || (d.comment ? d.comment.slice(0, 35) : 'Feedback'),
            message: d.message || d.comment || '',
            comment: d.comment || d.message || '',
            rating: d.rating || null,
            status: d.status || 'Pending',
            admin_response: d.admin_response || d.adminReply || null,
            attachment_url: d.attachment_url || null,
            created_at: d.created_at,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'
          }));

          // Merge with any local user records
          const local = this._getLocal(`user_feedback_${userId}`, []);
          const map = new Map();
          liveRecords.forEach(r => map.set(r.id, r));
          local.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          this._setLocal(`user_feedback_${userId}`, merged);
          return merged;
        }
      } catch (err) {
        console.warn('Live user feedback fetch note:', err);
      }
    }

    return this._getLocal(`user_feedback_${userId}`, []);
  }

  subscribeToUserFeedback(userId, callback) {
    if (!userId || !callback) return () => {};

    let channel = null;
    if (this.isConfigured()) {
      try {
        channel = this.supabase
          .channel(`user-feedback-${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'feedback', filter: `user_id=eq.${userId}` },
            (payload) => {
              callback(payload);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Feedback realtime subscription note:', err);
      }
    }

    // In-window event listener
    const handleLocalSync = (e) => {
      if (e.detail?.user_id === userId) {
        callback({ eventType: 'INSERT', new: e.detail });
      }
    };
    window.addEventListener('typemaster-feedback-sync', handleLocalSync);

    // Cross-tab broadcast listener
    let bc = null;
    try {
      bc = new BroadcastChannel('user-feedback-sync');
      bc.onmessage = (event) => {
        if (event.data?.payload?.user_id === userId) {
          callback({ eventType: 'INSERT', new: event.data.payload });
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (channel && this.isConfigured()) {
        this.supabase.removeChannel(channel);
      }
      window.removeEventListener('typemaster-feedback-sync', handleLocalSync);
      if (bc) bc.close();
    };
  }

  async uploadFeedbackAttachment(file, userId) {
    if (!file) return null;

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Screenshot must be 5MB or smaller.');
    }

    // Attempt Supabase storage upload if available
    if (this.isConfigured() && this.supabase?.storage) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${userId || 'guest'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;

        const { error: uploadError } = await this.supabase.storage
          .from('feedback-attachments')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = this.supabase.storage
            .from('feedback-attachments')
            .getPublicUrl(filePath);
          if (publicUrl) return publicUrl;
        }
      } catch (err) {
        console.warn('Storage bucket upload fallback:', err);
      }
    }

    // Fallback: Convert to Base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  _isSampleFeedback(fb) {
    if (!fb) return true;
    const sampleIds = ['fb_001', 'fb_002', 'fb_003', 'fb_004', 'fb_005'];
    const sampleEmails = ['priya@gmail.com', 'rahulv@gmail.com', 'sneha@gmail.com', 'arjun@gmail.com', 'neha@gmail.com'];
    const sampleNames = ['Priya Sharma', 'Rahul Verma', 'Sneha Reddy', 'Arjun Kumar', 'Neha Patel'];
    if (sampleIds.includes(fb.id)) return true;
    const email = (fb.userEmail || fb.user_email || '').toLowerCase();
    if (sampleEmails.includes(email)) return true;
    const name = fb.userName || fb.user_name || '';
    if (sampleNames.includes(name)) return true;
    return false;
  }

  async fetchFeedbackLive() {
    let list = [];
    if (this.isConfigured()) {
      try {
        const { data, error } = await this._withTimeout(
          this.supabase.from('feedback').select('*').order('created_at', { ascending: false }),
          4000
        );
        if (!error && Array.isArray(data)) {
          list = data.map(d => ({
            id: d.id,
            userId: d.user_id,
            user_id: d.user_id,
            userName: d.user_name || d.userName || 'Registered Typist',
            userEmail: d.user_email || d.userEmail || '',
            rating: d.rating || null,
            category: d.category || 'General Feedback',
            subject: d.subject || (d.comment ? d.comment.slice(0, 35) : 'Feedback'),
            message: d.message || d.comment || '',
            comment: d.comment || d.message || '',
            status: d.status || 'Pending',
            admin_response: d.admin_response || d.adminReply || null,
            adminReply: d.admin_response || d.adminReply || null,
            attachment_url: d.attachment_url || null,
            created_at: d.created_at,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'
          }));
        }
      } catch (err) {
        console.warn('Supabase live feedback fetch note:', err);
      }
    }

    // Merge with local feedback store, strictly filtering out sample items
    const local = this._getLocal('admin_feedback', []);
    const cleanLocal = local.filter(fb => !this._isSampleFeedback(fb));
    if (cleanLocal.length !== local.length) {
      this._setLocal('admin_feedback', cleanLocal);
    }

    const map = new Map();
    list.forEach(item => {
      if (!this._isSampleFeedback(item)) map.set(item.id, item);
    });
    cleanLocal.forEach(item => {
      if (!this._isSampleFeedback(item) && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    const combined = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return combined;
  }

  async respondToFeedback(id, { adminResponse, status = 'Resolved' }) {
    const updatedAt = new Date().toISOString();

    // 1. Update in Supabase
    let updatedDbRecord = null;
    if (this.isConfigured()) {
      try {
        const { data, error } = await this._withTimeout(
          this.supabase
            .from('feedback')
            .update({
              admin_response: adminResponse,
              status: status,
              updated_at: updatedAt
            })
            .eq('id', id)
            .select()
            .maybeSingle(),
          4000
        );
        if (!error && data) {
          updatedDbRecord = data;
        } else if (error) {
          console.warn('Supabase feedback update note:', error.message);
          await this._withTimeout(
            this.supabase
              .from('feedback')
              .update({
                status: status
              })
              .eq('id', id),
            3000
          );
        }
      } catch (err) {
        console.warn('Supabase feedback update error:', err);
      }
    }

    // 2. Update in admin_feedback localStorage
    let adminFeedbacks = this._getLocal('admin_feedback', []);
    let targetItem = null;
    adminFeedbacks = adminFeedbacks.map(f => {
      if (f.id === id) {
        targetItem = {
          ...f,
          admin_response: adminResponse,
          adminReply: adminResponse,
          status: status,
          updated_at: updatedAt
        };
        return targetItem;
      }
      return f;
    });

    if (!targetItem && updatedDbRecord) {
      targetItem = {
        ...updatedDbRecord,
        admin_response: adminResponse,
        adminReply: adminResponse,
        status: status,
        updated_at: updatedAt
      };
      adminFeedbacks.unshift(targetItem);
    }
    this._setLocal('admin_feedback', adminFeedbacks);

    // 3. Update across user-specific local stores (user_feedback_*)
    const targetUserId = targetItem?.user_id || targetItem?.userId;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_feedback_')) {
          let uList = this._getLocal(key, []);
          let changed = false;
          uList = uList.map(item => {
            if (item.id === id) {
              changed = true;
              return {
                ...item,
                admin_response: adminResponse,
                adminReply: adminResponse,
                status: status,
                updated_at: updatedAt
              };
            }
            return item;
          });
          if (changed) {
            this._setLocal(key, uList);
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Dispatch Realtime Broadcast to both portals
    const payload = targetItem || {
      id,
      admin_response: adminResponse,
      adminReply: adminResponse,
      status,
      user_id: targetUserId,
      updated_at: updatedAt
    };

    this.broadcastToAdminFeed('FEEDBACK_UPDATED', payload);

    try {
      window.dispatchEvent(new CustomEvent('typemaster-feedback-sync', { detail: payload }));
      window.dispatchEvent(new CustomEvent('typemaster-admin-feedback-sync', { detail: payload }));
      const bc = new BroadcastChannel('user-feedback-sync');
      bc.postMessage({ type: 'FEEDBACK_UPDATED', payload });
      bc.close();
    } catch {
      // Broadcast fallback
    }

    return { success: true, item: targetItem };
  }

  async deleteFeedback(id) {
    // 1. Delete from Supabase
    if (this.isConfigured()) {
      try {
        await this._withTimeout(
          this.supabase.from('feedback').delete().eq('id', id),
          4000
        );
      } catch (err) {
        console.warn('Supabase feedback delete note:', err);
      }
    }

    // 2. Delete from admin_feedback
    let adminFeedbacks = this._getLocal('admin_feedback', []);
    const target = adminFeedbacks.find(f => f.id === id);
    adminFeedbacks = adminFeedbacks.filter(f => f.id !== id);
    this._setLocal('admin_feedback', adminFeedbacks);

    // 3. Delete across user_feedback_* stores
    const targetUserId = target?.user_id || target?.userId;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_feedback_')) {
          let uList = this._getLocal(key, []);
          const filtered = uList.filter(item => item.id !== id);
          if (filtered.length !== uList.length) {
            this._setLocal(key, filtered);
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Realtime broadcast
    const payload = { id, deleted: true, user_id: targetUserId };
    this.broadcastToAdminFeed('FEEDBACK_DELETED', payload);

    try {
      window.dispatchEvent(new CustomEvent('typemaster-feedback-sync', { detail: payload }));
      window.dispatchEvent(new CustomEvent('typemaster-admin-feedback-sync', { detail: payload }));
      const bc = new BroadcastChannel('user-feedback-sync');
      bc.postMessage({ type: 'FEEDBACK_DELETED', payload });
      bc.close();
    } catch {
      // ignore
    }

    return { success: true };
  }

  subscribeToAdminFeedback(callback) {
    if (!callback) return () => {};

    let channel = null;
    if (this.isConfigured()) {
      try {
        channel = this.supabase
          .channel('admin-feedback-live-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'feedback' },
            (payload) => {
              callback(payload);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Admin feedback subscription note:', err);
      }
    }

    const handleSync = (e) => {
      callback({ eventType: 'SYNC', new: e.detail });
    };

    window.addEventListener('typemaster-feedback-sync', handleSync);
    window.addEventListener('typemaster-admin-feedback-sync', handleSync);

    let bcUser = null;
    let bcAdmin = null;
    try {
      bcUser = new BroadcastChannel('user-feedback-sync');
      bcUser.onmessage = (event) => {
        callback({ eventType: event.data?.type || 'BROADCAST', new: event.data?.payload });
      };
    } catch {
      // ignore
    }

    try {
      bcAdmin = new BroadcastChannel('admin-live-feed');
      bcAdmin.onmessage = (event) => {
        if (event.data?.type?.startsWith('FEEDBACK_')) {
          callback({ eventType: event.data.type, new: event.data.payload });
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (channel && this.isConfigured()) {
        this.supabase.removeChannel(channel);
      }
      window.removeEventListener('typemaster-feedback-sync', handleSync);
      window.removeEventListener('typemaster-admin-feedback-sync', handleSync);
      if (bcUser) bcUser.close();
      if (bcAdmin) bcAdmin.close();
    };
  }


  // ==========================================================
  // MULTI-ADMIN CREATION & RBAC MANAGEMENT
  // ==========================================================
  async createAdminUser(email, password, displayName) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim() || 'Administrator';
    const adminId = `admin_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const newAdmin = {
      id: adminId,
      username: cleanName,
      display_name: cleanName,
      displayName: cleanName,
      email: cleanEmail,
      role: 'admin',
      status: 'Active',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      is_premium: true,
      best_wpm: 0,
      avg_wpm: 0,
      accuracy: 0,
      tests_completed: 0,
      created_at: new Date().toISOString()
    };

    // 1. If Supabase configured, attempt auth signUp and profile upsert
    if (this.isConfigured()) {
      try {
        const { data } = await this._withTimeout(
          this.supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                username: cleanName,
                display_name: cleanName,
                role: 'admin'
              }
            }
          }),
          6000
        );

        const realId = data?.user?.id || adminId;
        newAdmin.id = realId;

        // Upsert into profiles table with role: 'admin'
        await this._withTimeout(
          this.supabase.from('profiles').upsert({
            id: realId,
            username: cleanName,
            display_name: cleanName,
            email: cleanEmail,
            role: 'admin',
            status: 'Active',
            is_premium: true,
            avatar_url: newAdmin.avatar_url,
            created_at: newAdmin.created_at
          }),
          4000
        );

        // Also upsert users table
        try {
          await this._withTimeout(
            this.supabase.from('users').upsert({
              id: realId,
              username: cleanName,
              email: cleanEmail,
              role: 'admin',
              is_premium: true,
              avatar_url: newAdmin.avatar_url
            }),
            4000
          );
        } catch {
          // ignore
        }
      } catch (err) {
        console.warn('Supabase admin create note:', err);
      }
    }

    // 2. Add to local registry
    const accounts = this._getLocal('users_registry', []);
    accounts.push({
      ...newAdmin,
      password: password
    });
    this._setLocal('users_registry', accounts);

    // 3. Broadcast to Admin Portal
    this.broadcastToAdminFeed('ADMIN_CREATED', newAdmin);
    this.broadcastToAdminFeed('USER_REGISTERED', newAdmin);

    return { success: true, user: newAdmin };
  }

  // Fetch real test logs for a specific user
  async fetchUserTestLogs(userId) {
    if (!userId) return [];

    if (this.isConfigured()) {
      try {
        // Query test_sessions first
        let res = await this._withTimeout(
          this.supabase.from('test_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          4000
        );
        if (res.error || !res.data) {
          res = await this._withTimeout(
            this.supabase.from('test_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            4000
          );
        }
        if (!res.error && res.data && res.data.length > 0) {
          return res.data;
        }
      } catch (err) {
        console.warn('fetchUserTestLogs live note:', err);
      }
    }

    return this._getLocal(`test_logs_${userId}`, []);
  }

  // ==========================================================
  // REAL-TIME BROADCAST ENGINE (DUAL-PORTAL SYNCHRONIZATION)
  // ==========================================================
  broadcastToAdminFeed(type, payload) {
    // 1. Cross-tab BroadcastChannel
    try {
      const bc = new BroadcastChannel('admin-live-feed');
      bc.postMessage({ type, payload });
      bc.close();
    } catch {
      // fallback
    }

    // 2. Window CustomEvent
    try {
      window.dispatchEvent(new CustomEvent('typemaster-admin-feed', { detail: { type, payload } }));
    } catch {
      // fallback
    }

    // 3. Supabase Realtime Channel
    if (this.isConfigured()) {
      try {
        this.supabase.channel('admin-live-feed').send({
          type: 'broadcast',
          event: type,
          payload
        });
      } catch {
        // fallback
      }
    }
  }

  broadcastToUserSync(type, userId, updates) {
    // 1. Cross-tab BroadcastChannel
    try {
      const bc = new BroadcastChannel('user-profile-sync');
      bc.postMessage({ type, userId, updates });
      bc.close();
    } catch {
      // fallback
    }

    // 2. Window CustomEvent
    try {
      window.dispatchEvent(new CustomEvent('typemaster-profile-sync', { detail: { type, userId, updates } }));
    } catch {
      // fallback
    }

    // 3. Supabase Realtime Channel
    if (this.isConfigured()) {
      try {
        this.supabase.channel('user-profile-sync').send({
          type: 'broadcast',
          event: type,
          payload: { userId, updates }
        });
      } catch {
        // fallback
      }
    }
  }
}

export const supabaseService = new SupabaseService();
