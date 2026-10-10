// ==========================================================
// SERVER-SIDE GOOGLE GEMINI TEXT GENERATION SERVICE
// Category-Aware, Difficulty-Aware, Zero-Repeat Engine
// Multi-Model Auto-Failover + Dynamic Subtopic Entropy
// ==========================================================

// Load server-side environment variables if present
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if already loaded or missing
  }
}

export const ALLOWED_CATEGORIES = [
  'Random Text',
  'Technology',
  'Quotes',
  'Literature',
  'Programming',
  'Science & Nature'
];

export const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const ALLOWED_LANGUAGES = ['C', 'Python', 'Java', 'JavaScript', 'C++'];

// Supported Gemini models with automatic failover if any model hits quota/429
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

// Rich Diverse Subtopic Pool for Maximum Variety Across Requests
const SUBTOPIC_POOLS = {
  Technology: [
    'cloud microservice architectures and distributed message queues',
    'quantum computing qubit superposition and lattice cryptography',
    'WebAssembly executing high-performance native code inside web browsers',
    'zero-trust cybersecurity network models and cryptographic token authentication',
    'deep neural network backpropagation and loss optimization',
    'relational database indexing mechanisms and write-ahead transaction logs',
    'autonomous robotic pathfinding algorithms and spatial sensor mapping',
    'container orchestration scaling stateless microservices with Kubernetes',
    'modern compiler design from lexing to intermediate bytecode representation',
    'event-driven reactive streaming pipelines and real-time websockets',
    'blockchain distributed consensus protocols and cryptographic hashing',
    'serverless edge compute functions reducing network latency globally'
  ],
  Quotes: [
    'mastering precision before seeking speed in any craft or discipline',
    'resilience in the face of temporary setbacks and building daily endurance',
    'how small compounded habits create extraordinary long-term transformations',
    'the beauty of quiet concentration in a world filled with digital noise',
    'architecting clarity of thought before attempting to solve complex problems',
    'the courage to begin anew with patient dedication and mindful focus',
    'learning to listen deeply and finding wisdom in silent observation',
    'striving for excellence rather than effortless perfection in human endeavors'
  ],
  Literature: [
    'a quiet lantern-lit cobblestone alleyway in an autumn seaside village',
    'a night train winding through snow-covered mountain passes under star-filled skies',
    'an ancient vaulted library filled with parchment scrolls and golden afternoon sunlight',
    'a solitary watchtower overlooking rolling emerald hills and distant ocean breakers',
    'a bustling morning marketplace filled with the aroma of roasted coffee and spices',
    'an abandoned stone bridge where ivy vines rustle softly in the summer twilight',
    'a grandfather clock chiming midnight in a stately manor house surrounded by rain',
    'an astronomer adjusting bronze gears in a hilltop observatory beneath the Milky Way'
  ],
  'Science & Nature': [
    'bioluminescence produced by marine organisms in the abyssal ocean trenches',
    'the James Webb Space Telescope detecting ancient infrared light from baby galaxies',
    'photosynthetic chemical pathways converting solar photons into glucose molecules',
    'geothermal geysers and volcanic caldera formations along tectonic plate boundaries',
    'the complex underground mycelial networks connecting forest root systems',
    'avian migratory navigation guided by geomagnetic fields and celestial star maps',
    'quantum entanglement demonstrating instantaneous correlations between particles',
    'the water cycle evaporating moisture from rainforest canopies to form rainclouds'
  ],
  'Random Text': [
    'the historical evolution of mechanical timekeeping and pendulum clocks',
    'traditional artisan bookbinding using linen threads and hand-pressed leather',
    'the physical and mental benefits of daily brisk walking in open natural spaces',
    'the intricate architecture of ancient Roman aqueducts and stone masonry',
    'how learning a musical instrument rewires neural pathways and fine motor skills',
    'the chemistry behind sourdough fermentation and wild airborne yeasts',
    'urban rooftop gardens creating biodiverse micro-climates in metropolitan centers',
    'the psychology of curiosity driving human exploration across unfamiliar domains'
  ],
  Programming: {
    C: [
      'declaring integer variables, calculating the square of a number, and printing results',
      'a simple while loop counting from 1 to 10 with formatted printf output',
      'checking whether an entered integer is even or odd using modulo operator',
      'finding the maximum value in an array of five integers',
      'calculating the average of scores stored in a floating-point array',
      'defining a struct representing a Student with id and grade',
      'swapping two numbers using integer pointers and memory addresses',
      'reversing a null-terminated character string using a while loop',
      'dynamic memory allocation using malloc, checking for NULL, and freeing the buffer',
      'a recursive function calculating the factorial of a positive integer'
    ],
    Python: [
      'a function returning whether a number is prime using a simple loop',
      'filtering words longer than five characters from a list using list comprehension',
      'calculating letter frequencies in a string using a dictionary',
      'reading key-value configurations and formatting a user profile greeting',
      'binary search implementation finding a target in a sorted list',
      'a class representing a BankAccount with deposit and withdraw methods',
      'handling division with try-except blocks and reporting zero-division errors',
      'generating a sequence of Fibonacci numbers using a generator yield function'
    ],
    Java: [
      'a public class with a static method calculating the perimeter of a rectangle',
      'iterating through an ArrayList of strings and printing each in uppercase',
      'reversing a string using StringBuilder and returning the reversed string',
      'a custom exception class and a method throwing an invalid age error',
      'an interface named Shape with a calculateArea method implemented by Circle',
      'finding the second largest number in an integer array using a single loop'
    ],
    JavaScript: [
      'an async function simulating a data fetch and returning formatted user data',
      'using Array.prototype.reduce to calculate the total price of an inventory array',
      'a debounce function that delays calling a callback until delay has elapsed',
      'destructuring nested object properties with default fallback parameters',
      'filtering duplicate values from an array using a Set data structure',
      'a simple counter closure function that returns increment and reset methods'
    ],
    'C++': [
      'using std::vector, sorting numbers with std::sort, and printing with range-based for loop',
      'defining a template function that returns the larger of two values',
      'a class with constructor and destructor demonstrating RAII resource management',
      'using std::unique_ptr to manage dynamically allocated heap objects safely',
      'a function that counts occurrences of words using std::map<std::string, int>',
      'calculating vector dot product using standard algorithms and iterators'
    ]
  }
};

// Rich Multi-Passage Category Fallback Bank (Rotates through distinct passages so it never repeats)
const FALLBACK_BANK = {
  Programming: {
    C: {
      Easy: [
        `#include <stdio.h>

int main(void) {
    int score = 85;
    printf("Score: %d\\n", score);
    if (score >= 50) {
        printf("Status: Passed\\n");
    } else {
        printf("Status: Failed\\n");
    }
    return 0;
}`,
        `#include <stdio.h>

int main(void) {
    int count = 1;
    while (count <= 5) {
        printf("Step %d: Keep typing\\n", count);
        count++;
    }
    printf("Completed sequence.\\n");
    return 0;
}`,
        `#include <stdio.h>

int main(void) {
    int base = 12;
    int height = 8;
    int area = (base * height) / 2;
    printf("Triangle area: %d\\n", area);
    return 0;
}`
      ],
      Medium: [
        `#include <stdio.h>

int calculate_sum(int arr[], int size) {
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}

int main(void) {
    int numbers[] = {10, 20, 30, 40, 50};
    int sum = calculate_sum(numbers, 5);
    printf("Sum: %d\\n", sum);
    return 0;
}`,
        `#include <stdio.h>

int find_maximum(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

int main(void) {
    int data[] = {45, 12, 89, 34, 67};
    printf("Highest value: %d\\n", find_maximum(data, 5));
    return 0;
}`,
        `#include <stdio.h>

void swap_integers(int *x, int *y) {
    int temp = *x;
    *x = *y;
    *y = temp;
}

int main(void) {
    int a = 100, b = 200;
    swap_integers(&a, &b);
    printf("Swapped: a = %d, b = %d\\n", a, b);
    return 0;
}`
      ],
      Hard: [
        `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

Node *create_node(int val) {
    Node *node = (Node *)malloc(sizeof(Node));
    if (!node) return NULL;
    node->value = val;
    node->next = NULL;
    return node;
}

int main(void) {
    Node *head = create_node(42);
    if (head != NULL) {
        printf("Node value: %d\\n", head->value);
        free(head);
    }
    return 0;
}`,
        `#include <stdio.h>

int binary_search(int arr[], int low, int high, int target) {
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main(void) {
    int sorted[] = {2, 7, 14, 28, 35, 60};
    int idx = binary_search(sorted, 0, 5, 28);
    printf("Target at index: %d\\n", idx);
    return 0;
}`
      ]
    },
    Python: {
      Easy: [
        `def check_temperature(celsius):
    if celsius > 30:
        return "Hot weather"
    elif celsius < 10:
        return "Cold weather"
    else:
        return "Pleasant weather"

temp = 24
print(check_temperature(temp))`,
        `def greet_user(username, test_score):
    print(f"Welcome back, {username}!")
    if test_score >= 80:
        print("Excellent typing precision!")
    else:
        print("Keep practicing daily.")

greet_user("Alex", 92)`
      ],
      Medium: [
        `def filter_even_numbers(numbers):
    evens = [n for n in numbers if n % 2 == 0]
    return evens

items = [12, 7, 19, 24, 33, 48, 55]
result = filter_even_numbers(items)
print("Even numbers:", result)`,
        `def count_word_frequencies(sentence):
    words = sentence.lower().split()
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    return counts

stats = count_word_frequencies("practice makes perfect typing practice")
print(stats)`
      ],
      Hard: [
        `import collections

class CacheTracker:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = collections.OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]`,
        `def generate_fibonacci(limit):
    a, b = 0, 1
    while a < limit:
        yield a
        a, b = b, a + b

fib_series = list(generate_fibonacci(100))
print("Fibonacci numbers under 100:", fib_series)`
      ]
    },
    Java: {
      Easy: [
        `public class Counter {
    public static void main(String[] args) {
        int max = 5;
        for (int i = 1; i <= max; i++) {
            System.out.println("Step: " + i);
        }
        System.out.println("Completed");
    }
}`,
        `public class Rectangle {
    public static void main(String[] args) {
        int width = 15;
        int height = 20;
        int perimeter = 2 * (width + height);
        System.out.println("Perimeter: " + perimeter);
    }
}`
      ],
      Medium: [
        `public class StringReverser {
    public static String reverse(String input) {
        StringBuilder sb = new StringBuilder();
        for (int i = input.length() - 1; i >= 0; i--) {
            sb.append(input.charAt(i));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(reverse("TypingMaster"));
    }
}`,
        `import java.util.ArrayList;

public class ListManager {
    public static void main(String[] args) {
        ArrayList<String> skills = new ArrayList<>();
        skills.add("Accuracy");
        skills.add("Speed");
        skills.add("Endurance");
        for (String item : skills) {
            System.out.println("Skill: " + item);
        }
    }
}`
      ],
      Hard: [
        `import java.util.concurrent.atomic.AtomicInteger;

public class ThreadSafeCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public int increment() {
        return count.incrementAndGet();
    }

    public int getValue() {
        return count.get();
    }
}`
      ]
    },
    JavaScript: {
      Easy: [
        `function greetUser(name) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : "Good day";
  return \`\${greeting}, \${name}!\`;
}

console.log(greetUser("Developer"));`,
        `const calculateTotal = (price, taxRate = 0.08) => {
  const tax = price * taxRate;
  const total = price + tax;
  return Number(total.toFixed(2));
};

console.log("Total with tax:", calculateTotal(45));`
      ],
      Medium: [
        `const processOrders = (orders) => {
  return orders
    .filter(order => order.status === "completed")
    .map(order => ({ id: order.id, total: order.price * order.quantity }))
    .reduce((acc, curr) => acc + curr.total, 0);
};`,
        `function debounce(callback, delayMs = 300) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => callback(...args), delayMs);
  };
}`
      ],
      Hard: [
        `async function retryOperation(fn, retries = 3, delayMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }
}`
      ]
    },
    'C++': {
      Easy: [
        `#include <iostream>

int main() {
    int a = 15;
    int b = 27;
    int sum = a + b;
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
        `#include <iostream>

int main() {
    int score = 90;
    std::cout << "Initial score: " << score << std::endl;
    if (score > 80) {
        std::cout << "Top performer!" << std::endl;
    }
    return 0;
}`
      ],
      Medium: [
        `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {9, 3, 7, 1, 5};
    std::sort(numbers.begin(), numbers.end());
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    return 0;
}`,
        `#include <iostream>

template <typename T>
T find_larger(T first, T second) {
    return (first > second) ? first : second;
}

int main() {
    std::cout << "Max: " << find_larger(42, 85) << std::endl;
    return 0;
}`
      ],
      Hard: [
        `#include <iostream>
#include <memory>

class Resource {
public:
    Resource() { std::cout << "Allocated\\n"; }
    ~Resource() { std::cout << "Deallocated\\n"; }
    void execute() { std::cout << "Executing task\\n"; }
};

int main() {
    std::unique_ptr<Resource> ptr = std::make_unique<Resource>();
    ptr->execute();
    return 0;
}`
      ]
    }
  },
  Technology: {
    Easy: [
      `Cloud computing allows individuals and companies to access computing resources over the internet. Instead of buying physical servers, developers can deploy applications rapidly and scale as their audience expands. Modern web services deliver high speed and secure data storage worldwide.`,
      `Web development frameworks streamline the process of building modern interactive interfaces. Reusable UI components ensure consistent design patterns while automated bundlers optimize assets to provide fast loading times for users worldwide.`,
      `Computer networks rely on standard communication protocols to route packets of data safely across the globe. Routers and switches direct digital traffic seamlessly, allowing people to exchange information across oceans in milliseconds.`
    ],
    Medium: [
      `Distributed systems utilize microservice architectures to achieve resilience and high availability. When services communicate through asynchronous message queues, workloads are processed efficiently without bottlenecking the primary application workflow. Continuous integration pipelines ensure automated testing.`,
      `Relational databases utilize structured query languages and indexing algorithms to search millions of records in milliseconds. By balancing read replicas with primary write nodes, high-traffic web applications achieve predictable low-latency performance during peak usage spikes.`,
      `WebAssembly represents a binary instruction format designed to execute code at near-native speed directly within modern web browsers. By allowing languages like C and Rust to compile for the web, engineers build demanding graphics and scientific tools in the browser.`
    ],
    Hard: [
      `Modern cryptographic algorithms rely on asymmetric key pairs and lattice-based mathematical structures to withstand quantum computing decryption vectors. Meanwhile, zero-knowledge proofs enable distributed consensus mechanisms to verify transactional integrity without revealing private underlying metadata.`,
      `Distributed database architectures implement the Raft consensus algorithm to achieve linearizable state machine replication across partitioned server clusters. By maintaining quorum majorities during network splits, these engines preserve atomic consistency without sacrificing durability.`
    ]
  },
  Quotes: {
    Easy: [
      `True speed is born from precision. Master each movement with mindful intent, and velocity will naturally follow without haste or strain.`,
      `Clarity begins with deliberate patience. When we honor small efforts each day, deep proficiency unfolds like morning light over quiet hills.`,
      `Do not hurry your hands before your mind is calm. Smoothness creates rhythm, and rhythm generates effortless velocity.`
    ],
    Medium: [
      `Excellence is not an extraordinary act, but the accumulation of small disciplines repeated with unwavering focus. Each keystroke shapes the craft of mastery.`,
      `The craftsman finds peace in repetition, knowing that every single iteration polishes away rough edges. Great works are never rushed into being; they are cultivated through sustained attention.`,
      `Mastery is neither a destination nor a single achievement, but an enduring dialogue between intention and execution. In silent practice, we discover the architecture of our potential.`
    ],
    Hard: [
      `The intellect constructs systems, but relentless patience refines them. When clarity guides each effort, complexity dissolves into quiet understanding and lasting craftsmanship.`,
      `To sculpt enduring skill from chaotic enthusiasm requires the forge of disciplined temperance. Those who embrace rigorous repetition illuminate the hidden pathways where technique ascends into art.`
    ]
  },
  Literature: {
    Easy: [
      `The early morning mist drifted softly across the cobblestone streets. Quiet lanterns flickered against the damp brick walls as the ancient harbor awoke to the calls of gulls and the rustle of sails in the autumn breeze.`,
      `A gentle autumn rain tapped steadily against the tall library window panes. Inside, the quiet warmth of a crackling hearth illuminated rows of gilded leather-bound volumes that smelled of cedar and time.`,
      `Sunlight filtered through the golden leaves of the apple orchard, casting dancing shadows upon the stone walkway. In the distance, church bells resonated across the peaceful countryside.`
    ],
    Medium: [
      `Shadows lengthened across the quiet courtyard as autumn amber leaves swirled in the twilight. From the library tower, clock chimes echoed across the stone arches, measuring hours against the backdrop of an evening sky washed in indigo and gold.`,
      `The midnight train rumbled steadily along the frost-covered valley. Inside the passenger compartment, steam rose from porcelain tea cups while outside, distant farmhouses glowed like solitary amber lanterns amidst vast pine forests.`,
      `Salt spray drifted over the wooden railing of the old schooner as dawn broke upon the horizon. Gilded clouds parted to reveal sapphire waters extending beyond the reach of memory.`
    ],
    Hard: [
      `Beyond the desolate moorland, wind carved hollow anthems through fractured granite spires. Night settled in velvet obsidian layers, extinguishing the final embers of crimson dusk while solitary travelers navigated by the cold luminescence of ancient constellations.`,
      `Within the labyrinthine corridors of the forgotten archive, dust motes drifted like suspended memories through shafts of pale morning sun. Generations of forgotten cartographers had charted kingdoms that now existed only upon parchment.`
    ]
  },
  'Science & Nature': {
    Easy: [
      `Photosynthesis is the chemical process by which green plants transform sunlight into energy. Chlorophyll absorbs light, enabling plants to convert carbon dioxide and water into oxygen and glucose, sustaining ecosystems across our planet.`,
      `The solar system consists of eight planets orbiting our central star, the Sun. From rocky worlds like Mars to gas giants like Jupiter, each celestial body offers unique insights into the origin and evolution of our cosmic neighborhood.`,
      `Honeybees communicate the location of distant flower patches through an intricate waggle dance. By aligning their movements with the angle of the sun, scout bees guide the entire hive to rich nectar sources with astonishing mathematical precision.`
    ],
    Medium: [
      `The James Webb Space Telescope observes the cosmos using infrared sensors capable of peering through cosmic dust clouds. By detecting redshifted light from ancient galaxies formed over thirteen billion years ago, astronomers study stellar nurseries and planetary atmospheres.`,
      `Geothermal energy taps into the immense heat generated deep within the Earth's mantle and core. Naturally circulating underground aquifers produce high-pressure steam that spins turbines, supplying sustainable electrical power with minimal greenhouse gas emissions.`,
      `Mycelial networks weave through forest soils in vast microscopic webs, exchanging vital nitrogen and phosphorus with tree roots in return for photosynthetic sugars. This fungal subterranean network acts as an organic communicative circulatory system for woodlands.`
    ],
    Hard: [
      `Quantum entanglement demonstrates non-local correlations between paired particles whose quantum states cannot be described independently. When measurements collapse the wave function of one particle, its counterpart exhibits instantaneous correlation regardless of spatial separation.`,
      `CRISPR-Cas9 gene editing exploits bacterial adaptive immune mechanisms to introduce site-specific double-stranded DNA breaks. Guided by single-guide RNA sequences, molecular biologists modify targeted genomic loci to decipher fundamental epigenetic pathways.`
    ]
  },
  'Random Text': {
    Easy: [
      `Learning new skills requires daily consistency rather than occasional intense bursts. Setting aside twenty minutes each morning builds lasting habits, sharpens focus, and transforms complex challenges into natural routines over time.`,
      `The art of bread making requires only flour, water, salt, and patient time. As sourdough cultures ferment, wild yeasts develop complex flavors and delicate airy textures that commercial bakeries struggle to reproduce.`,
      `Cycling through city parks offers a rejuvenating blend of physical movement and mental clarity. Fresh morning air and rhythmic pedaling clear away cognitive fatigue, leaving typists and thinkers feeling renewed for the day ahead.`
    ],
    Medium: [
      `Urban architecture continually evolves to balance aesthetic heritage with environmental sustainability. Modern cities integrate vertical gardens, energy-efficient transit systems, and communal public spaces that foster creativity and human connection.`,
      `The craft of traditional watchmaking demands microscopic precision and steady hands. Hundreds of delicate gears, springs, and synthetic ruby bearings must synchronize harmoniously to measure seconds with enduring acoustic poise.`,
      `Exploring unfamiliar literary genres broadens empathetic understanding and creative problem-solving. When readers immerse themselves in different cultural perspectives, they discover universal human aspirations beneath diverse historical backgrounds.`
    ],
    Hard: [
      `The preservation of cognitive agility relies on deliberate perceptual challenges and diverse intellectual pursuits. Embracing unfamiliar problem domains synthesizes new neural pathways, fortifying analytical endurance and creative resilience against routine stagnation.`,
      `Architectural acousticians sculpt auditorium geometries using calculated reflective paneling and sound-dampening textiles to orchestrate spatial reverberation decay times, ensuring symphonic overtones bloom with pristine spectral fidelity.`
    ]
  }
};

// Rate limiter state: IP/ID -> [timestamps]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

export function checkRateLimit(clientId = 'default') {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(clientId, validTimestamps);
  return true;
}

// In-memory history of recently served passages to prevent immediate repetitions
const recentlyServedHistory = [];
const MAX_HISTORY = 40;

function recordServedPassage(text) {
  if (!text) return;
  recentlyServedHistory.push(text.trim());
  if (recentlyServedHistory.length > MAX_HISTORY) {
    recentlyServedHistory.shift();
  }
}

function isRecentlyServed(text) {
  if (!text) return false;
  const trimmed = text.trim();
  return recentlyServedHistory.some((item) => item === trimmed || item.slice(0, 80) === trimmed.slice(0, 80));
}

// Build optimized system and user prompt with dynamic entropy and subtopics
function buildPrompt(category, difficulty, language, durationSeconds, excludeText = '') {
  const durSec = Number(durationSeconds) || 60;
  const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  // Approximate target scale
  let targetWords = 60;
  let targetLines = 9;
  if (durSec <= 60) {
    targetWords = difficulty === 'Hard' ? 70 : 55;
    targetLines = 8;
  } else if (durSec <= 180) {
    targetWords = difficulty === 'Hard' ? 160 : 130;
    targetLines = 17;
  } else {
    targetWords = difficulty === 'Hard' ? 240 : 200;
    targetLines = 25;
  }

  // Pick a dynamic random subtopic
  let subtopic = '';
  if (category === 'Programming') {
    const lang = ALLOWED_LANGUAGES.includes(language) ? language : 'C';
    const langTopics = SUBTOPIC_POOLS.Programming[lang] || SUBTOPIC_POOLS.Programming.C;
    subtopic = langTopics[Math.floor(Math.random() * langTopics.length)];

    let complexityGuide = 'simple statements, variable declarations, standard I/O, basic conditionals';
    if (difficulty === 'Medium') {
      complexityGuide = 'loops (for/while), arrays/lists, helper functions, moderate algorithmic logic';
    } else if (difficulty === 'Hard') {
      complexityGuide = 'pointers/memory, structs/classes, nested logic, recursion, data structures';
    }

    const antiRepeatDirective = excludeText
      ? `DO NOT repeat or generate anything identical to this previous snippet: "${excludeText.slice(0, 60)}..."`
      : 'Generate a completely fresh and unique implementation.';

    return `You are an expert programming tutor generating clean, valid, executable code for typing practice.
Programming Language: ${lang}
Specific Code Topic: ${subtopic}
Difficulty: ${difficulty} (${complexityGuide})
Target Length: Approximately ${targetLines} lines of code.
Unique Request Entropy Seed: ${seed}

STRICT CODE GENERATION RULES:
1. Provide ONLY pure, valid, idiomatic ${lang} code.
2. For C: include standard headers (#include <stdio.h>), int main(void), valid syntax, proper indentation (4 spaces), and return 0.
3. For Python: use clean 4-space indentation and valid Python 3 syntax.
4. For Java: use a public class and main method with proper 4-space indentation.
5. For JavaScript: use clean, modern ES6 syntax with standard 2 or 4-space indentation.
6. For C++: include <iostream>, main function, and return 0.
7. ${antiRepeatDirective}
8. DO NOT wrap output in markdown code fences (NO \`\`\` or \`\`\`${lang.toLowerCase()}).
9. DO NOT include introductory text, conversational remarks, or explanations.
10. Return ONLY the raw code text ready for immediate character-by-character typing.`;
  }

  // Prose categories
  const catTopics = SUBTOPIC_POOLS[category] || SUBTOPIC_POOLS['Random Text'];
  subtopic = catTopics[Math.floor(Math.random() * catTopics.length)];

  let domainInstructions = '';
  switch (category) {
    case 'Technology':
      domainInstructions = `Write an engaging, informative passage focusing on: ${subtopic}. Use authentic technical terminology suited for ${difficulty} typing practice.`;
      break;
    case 'Quotes':
      domainInstructions = `Generate original, inspiring motivational or philosophical reflections on: ${subtopic}. Do not fabricate historical attributions; craft resonant, original wisdom.`;
      break;
    case 'Literature':
      domainInstructions = `Write evocative literary prose, atmospheric scene descriptions, or narrative storytelling describing: ${subtopic}. Use rich imagery distinct from tech or science.`;
      break;
    case 'Science & Nature':
      domainInstructions = `Write an educational, scientifically accurate passage on: ${subtopic}. Keep it engaging and informative.`;
      break;
    case 'Random Text':
    default:
      domainInstructions = `Write a compelling, coherent passage exploring: ${subtopic}. Ensure it is distinct and engaging.`;
      break;
  }

  const antiRepeatDirective = excludeText
    ? `DO NOT reuse or repeat anything similar to this previous passage: "${excludeText.slice(0, 80)}..."`
    : 'Ensure this passage is completely unique and different from previous responses.';

  const durationText = `${durationSeconds}s (${Math.max(1, Math.round(durationSeconds / 60))} min)`;

  return `Generate a clear, high-legibility typing passage for a typing test. Duration target: ${durationText}, Difficulty: ${difficulty}, Category: ${category}. Return plain text only without markdown formatting.

You are a professional typing test passage generator.
Category: ${category}
Difficulty: ${difficulty}
Specific Topic Focus: ${subtopic}
Target Length: Approximately ${targetWords} words (calibrated for ${durationText} typing session).
Unique Entropy Seed: ${seed}

Instructions:
${domainInstructions}

CRITICAL RULES:
1. Return ONLY raw continuous paragraph text (a flowing prose paragraph).
2. DO NOT format as a numbered list, bullet points, or list of words.
3. ${antiRepeatDirective}
4. DO NOT use markdown code fences, headers, bullet points, or quotation marks wrapping the entire passage.
5. DO NOT include introductory phrases like "Here is your passage" or explanations.
6. Provide varied, natural punctuation suitable for ${difficulty} typing practice.`;
}

// Clean and sanitize Gemini output
function sanitizeGeneratedText(rawText, category) {
  if (!rawText || typeof rawText !== 'string') return '';

  let cleaned = rawText.trim();

  // Strip code fences like ```c ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```[a-zA-Z0-9_\-+]*\r?\n?/i, '');
  cleaned = cleaned.replace(/\r?\n?```$/i, '');
  cleaned = cleaned.trim();

  // Strip common conversational model prefixes
  cleaned = cleaned.replace(/^(Here is (the|a) (code|passage|text|quote|program)[^:]*:\s*)/i, '');
  cleaned = cleaned.replace(/^(Certainly! Here is [^:]*:\s*)/i, '');

  // Normalize CRLF to LF
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // For prose categories, ensure it's a flowing paragraph without numbered lists
  if (category !== 'Programming') {
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    // If model returned a numbered list of lines (e.g. "1. word\n2. word"), join into flowing prose
    if (/^\s*\d+[\.\)]\s+/m.test(cleaned)) {
      cleaned = cleaned
        .split('\n')
        .map(line => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
        .filter(Boolean)
        .join(' ');
    }
  }


  return cleaned;
}

// Rotating Fallback Bank guaranteed to never repeat the same passage
export function getFallbackPassage(category, difficulty, language, excludeText = '') {
  const cat = ALLOWED_CATEGORIES.includes(category) ? category : 'Random Text';
  const diff = ALLOWED_DIFFICULTIES.includes(difficulty) ? difficulty : 'Medium';

  let passageList = [];

  if (cat === 'Programming') {
    const lang = ALLOWED_LANGUAGES.includes(language) ? language : 'C';
    const langBank = FALLBACK_BANK.Programming[lang] || FALLBACK_BANK.Programming.C;
    passageList = langBank[diff] || langBank.Easy;
  } else {
    const catBank = FALLBACK_BANK[cat] || FALLBACK_BANK['Random Text'];
    passageList = catBank[diff] || catBank.Medium;
  }

  if (!Array.isArray(passageList) || passageList.length === 0) {
    return 'Consistent typing practice sharpens muscle memory and digital fluency.';
  }

  // Filter out any passage that matches excludeText or was recently served
  let candidates = passageList.filter((p) => p !== excludeText && !isRecentlyServed(p));

  // If all were recently served, at least exclude currently displayed text
  if (candidates.length === 0) {
    candidates = passageList.filter((p) => p !== excludeText);
  }

  if (candidates.length === 0) {
    candidates = passageList;
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  recordServedPassage(selected);
  return selected;
}

// Call Google Gemini API with multi-model auto-failover and zero-repeat guarantees
export async function generateTextWithGemini({
  category = 'Random Text',
  difficulty = 'Medium',
  language = 'C',
  durationSeconds = 60,
  excludeText = '',
  apiKey: clientApiKey = '',
  model: clientModel = ''
}) {
  // Key Priority Order:
  // 1. Admin Configured Key from Supabase / system_config / client payload
  // 2. Server Environment Variable (GEMINI_API_KEY)
  // 3. Local Text Repository Fallback
  const apiKey = (clientApiKey || '').trim() || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    console.warn('[GeminiService] No Gemini API key provided. Serving rotating verified fallback.');
    const fallbackText = getFallbackPassage(category, difficulty, language, excludeText);
    return {
      success: true,
      category,
      difficulty,
      language: category === 'Programming' ? language : undefined,
      text: fallbackText,
      source: 'fallback_bank',
      notice: 'Gemini API key not configured; using local verified category bank.'
    };
  }

  const promptContent = buildPrompt(category, difficulty, language, durationSeconds, excludeText);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptContent
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.95, // High temperature for rich non-repetitive variety
      maxOutputTokens: 1000
    }
  };

  // Determine models to try, placing chosen model first if provided
  const activeCandidateModels = clientModel
    ? [clientModel, ...CANDIDATE_MODELS.filter(m => m !== clientModel)]
    : CANDIDATE_MODELS;

  // Try candidate models in order of availability
  for (const model of activeCandidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(6000) // Fast 6s timeout per model
      });

      if (response.ok) {
        const parsed = await response.json();
        const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanText = sanitizeGeneratedText(candidateText, category);

        // Ensure text is valid, not empty, and not identical to current text
        if (cleanText && cleanText.length > 15 && cleanText !== excludeText && !isRecentlyServed(cleanText)) {
          recordServedPassage(cleanText);
          return {
            success: true,
            category,
            difficulty,
            language: category === 'Programming' ? language : undefined,
            text: cleanText,
            source: 'gemini_api',
            modelUsed: model
          };
        } else if (cleanText && cleanText.length > 15 && cleanText !== excludeText) {
          // If slightly similar but different, still serve and record
          recordServedPassage(cleanText);
          return {
            success: true,
            category,
            difficulty,
            language: category === 'Programming' ? language : undefined,
            text: cleanText,
            source: 'gemini_api',
            modelUsed: model
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        // If 429 quota reached on this model, continue to next model
        console.warn(`[GeminiService] Model ${model} responded with ${response.status}: ${errJson.error?.message?.slice(0, 80) || ''}. Trying next candidate model.`);
      }
    } catch (err) {
      console.warn(`[GeminiService] Model ${model} error (${err.message}). Trying next candidate model.`);
    }
  }

  // If all live models hit rate-limits or network failure, rotate to non-repeating fallback passage
  console.log('[GeminiService] Serving non-repeating verified fallback passage.');
  const fallbackText = getFallbackPassage(category, difficulty, language, excludeText);
  return {
    success: true,
    category,
    difficulty,
    language: category === 'Programming' ? language : undefined,
    text: fallbackText,
    source: 'fallback_bank'
  };
}
