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
  'Science & Nature',
  'Medical'
];

export const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const ALLOWED_LANGUAGES = ['C', 'Python', 'Java', 'JavaScript', 'C++'];

// Supported Gemini models with automatic failover if any model hits quota/429
export const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview'
];

// Active runtime configuration (Single source of truth for key and model)
let activeGeminiConfig = {
  apiKey: (process.env.GEMINI_API_KEY || '').trim(),
  model: (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim()
};

export function getActiveGeminiConfig() {
  return {
    isConfigured: Boolean(activeGeminiConfig.apiKey && activeGeminiConfig.apiKey.length > 8),
    model: activeGeminiConfig.model || 'gemini-3.5-flash',
    maskedKey: activeGeminiConfig.apiKey
      ? `••••••••••••${activeGeminiConfig.apiKey.slice(-4)}`
      : ''
  };
}

export function getInternalGeminiConfig() {
  return {
    apiKey: activeGeminiConfig.apiKey || (process.env.GEMINI_API_KEY || '').trim(),
    model: activeGeminiConfig.model || (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim()
  };
}

export function updateActiveGeminiConfig({ apiKey, model }) {
  if (apiKey !== undefined) {
    activeGeminiConfig.apiKey = (apiKey || '').trim();
    process.env.GEMINI_API_KEY = activeGeminiConfig.apiKey;
  }
  if (model) {
    activeGeminiConfig.model = model.trim();
    process.env.GEMINI_MODEL = activeGeminiConfig.model;
  }
  return getActiveGeminiConfig();
}

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
  Medical: {
    'Medical Billing & Claims': [
      'CMS-1500 and UB-04 claim forms, service dates, provider NPI numbers, and electronic claim submission EDI 837 protocols',
      'clean claim submission rate benchmarks, primary versus secondary payer coordination of benefits, and adjudication rules',
      'claim rejection versus denial workflows, timely filing limit deadlines, and formal appeal letters with supporting chart notes',
      'clearinghouse front-end edits, batch transmission status tracking, and resolving unbundled service code rejections',
      'prior authorization tracking, referral numbers, pre-certification compliance, and revenue cycle management milestones'
    ],
    'Medical Terminology': [
      'cardiovascular and cerebrovascular pathology terms including atherosclerosis, transient ischemic attack, and myocardial infarction',
      'musculoskeletal conditions such as chondromalacia patellae, spondylolisthesis, arthroplasty, and osteoarthritis etiology',
      'gastroenterological terms including gastroesophageal reflux, cholelithiasis, diverticulitis, and endoscopy nomenclature',
      'endocrine disorders such as hyperthyroidism, diabetic retinopathy, ketoacidosis, and hypothalamic pituitary feedback loops',
      'pulmonary terminology including atelectasis, bronchiectasis, chronic obstructive pulmonary disease, and hypoxemia'
    ],
    'ICD-10-CM & CPT Coding': [
      'primary diagnosis assignment using ICD-10-CM codes such as E11.9 for type 2 diabetes and I10 for essential hypertension',
      'evaluation and management outpatient CPT codes 99213 and 99214 with modifier 25 for significant separate services',
      'procedural coding using CPT 43239 for upper gastrointestinal endoscopy with biopsy and surgical pathology documentation',
      'accurate application of ICD-10-CM Z-codes for routine screenings, preventive exams, and pre-operative clearances',
      'coding compliance rules, CPT modifier 59 for distinct procedural services, and National Correct Coding Initiative NCCI edits'
    ],
    'Insurance Verification': [
      'real-time electronic eligibility verification, active policy effective dates, group numbers, and subscriber coverage status',
      'annual deductible thresholds, remaining out-of-pocket maximums, and specialist copayment versus coinsurance obligations',
      'coordination of benefits determination, Medicare secondary payer rules, and commercial supplemental plan integration',
      'in-network participating provider directory validation, pre-existing condition terms, and HMO primary care referral policies',
      'health savings account HSA rules, flexible spending account FSA reimbursements, and benefit coverage limitations'
    ],
    'Patient Data Entry': [
      'patient demographic intake records: legal full name, date of birth, social security number, and verified residential address',
      'guarantor billing information, emergency contact designations, primary language preference, and marital status documentation',
      'medical record numbers MRN assignment, primary care physician selection, encounter admission dates, and electronic consent',
      'employer sponsor verification, subscriber group plan identification, policy ID numbers, and electronic health record indexing',
      'patient registration updates, pharmacy preference entry, allergy documentation, and advanced directive status recording'
    ],
    'Payment Posting & Accounts Receivable': [
      'electronic remittance advice ERA 835 automated posting, explanation of benefits EOB reconciliation, and contractual write-offs',
      'patient responsibility balance invoicing, copay receipt logging, and deductible adjustments across active patient ledgers',
      'aged accounts receivable A/R aging buckets (30, 60, 90, and 120 days), unallocated credit resolution, and bad debt write-downs',
      'reconciling daily lockbox deposits, credit card merchant transactions, and balancing daily batch reports in practice management systems',
      'payer underpayment appeals, fee schedule compliance monitoring, and recovery of overdue third-party commercial insurance balances'
    ],
    'Medical Documentation': [
      'clinical SOAP note formatting: subjective chief complaint, objective physical findings, clinical assessment, and care plan',
      'history of present illness HPI, past medical history PMH, review of systems ROS, and physician digital signature authentication',
      'operative reports, post-anesthesia care documentation, gross pathology descriptions, and structured hospital discharge summaries',
      'HIPAA privacy standards, confidentiality disclaimers, medical records release authorization, and electronic chart audit trails',
      'interdisciplinary clinical communication, nursing triage notes, physician consultation requests, and telehealth encounter logs'
    ],
    'Numbers & Special Characters': [
      'billing transactions with currency symbols: $1,425.50 charges, $850.00 insurance payment, $325.50 contractual adjustment, $250.00 patient balance',
      'service dates formatted as 04/18/2026, 05/12/2026, and 06/30/2026 with provider NPI #1841392041 and Tax ID #84-1928471',
      'structured codes with hyphens, decimals, and percentages: CPT 99214-25, ICD-10-CM J44.1, HCPCS G0438, 80% / 20% coinsurance split',
      'account summaries: Acct #84920, DOB: 09/14/1982, Copay: $35.00, Deductible: $1,500.00 ($450.00 met), Policy ID: #W94820184-01',
      'complex alphanumeric patient records: Claim ID #CLM-2026-9812, Rev Code: 0250, Units: 2, Total: $640.00, Auth #PA-88192-A'
    ]
  },
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
      `Computer networks rely on standard communication protocols to route packets of data safely across the globe. Routers and switches direct digital traffic seamlessly, allowing people to exchange information across oceans in milliseconds.`,
      `Cybersecurity practices protect computer networks, mobile devices, and sensitive private records from unauthorized access. Strong cryptographic passwords and two-factor authentication provide foundational defense layers for personal accounts.`,
      `Open source software communities collaborate publicly to build shared operating systems, web browsers, and programming tools. Developers across multiple continents review code and fix software defects transparently.`,
      `Data visualization tools transform complex numeric spreadsheets into interactive charts and intuitive graphs. Visual representations enable decision makers to spot meaningful patterns and emerging trends quickly.`
    ],
    Medium: [
      `Distributed systems utilize microservice architectures to achieve resilience and high availability. When services communicate through asynchronous message queues, workloads are processed efficiently without bottlenecking the primary application workflow. Continuous integration pipelines ensure automated testing.`,
      `Relational databases utilize structured query languages and indexing algorithms to search millions of records in milliseconds. By balancing read replicas with primary write nodes, high-traffic web applications achieve predictable low-latency performance during peak usage spikes.`,
      `WebAssembly represents a binary instruction format designed to execute code at near-native speed directly within modern web browsers. By allowing languages like C and Rust to compile for the web, engineers build demanding graphics and scientific tools in the browser.`,
      `Event-driven architectures decouple software components by broadcasting state changes through centralized event brokers. Consumers process discrete message streams independently, enabling horizontal scaling across distributed cloud server clusters.`,
      `Containerization packages software code together with all associated runtime dependencies and operating system libraries. Using container engines, software engineers ensure consistent execution behavior across development laptops and production clouds.`,
      `Machine learning models optimize parameters by minimizing mathematical loss functions across large training datasets. Gradient descent algorithms iteratively adjust synaptic weights until the system accurately classifies unseen data samples.`
    ],
    Hard: [
      `Modern cryptographic algorithms rely on asymmetric key pairs and lattice-based mathematical structures to withstand quantum computing decryption vectors. Meanwhile, zero-knowledge proofs enable distributed consensus mechanisms to verify transactional integrity without revealing private underlying metadata.`,
      `Distributed database architectures implement the Raft consensus algorithm to achieve linearizable state machine replication across partitioned server clusters. By maintaining quorum majorities during network splits, these engines preserve atomic consistency without sacrificing durability.`,
      `Autonomous robotic navigation systems synthesize inputs from lidar sensors, inertial measurement units, and stereoscopic computer vision feeds. Extended Kalman filters continuously update state estimations to map complex dynamic environments in real time.`,
      `Compiler optimization pipelines construct control flow graphs and convert syntax trees into static single assignment intermediate representations. Dead code elimination, loop unrolling, and register allocation algorithms maximize execution throughput.`,
      `Hardware-accelerated graphics pipelines leverage compute shaders and ray tracing hardware to calculate photorealistic light transport equations. Bounding volume hierarchies accelerate spatial intersection queries for millions of geometric primitives per second.`,
      `High-throughput streaming platforms implement zero-copy memory buffers and memory-mapped operating system files to process millions of concurrent socket connections with minimal context-switching overhead.`
    ]
  },
  Quotes: {
    Easy: [
      `True speed is born from precision. Master each movement with mindful intent, and velocity will naturally follow without haste or strain.`,
      `Clarity begins with deliberate patience. When we honor small efforts each day, deep proficiency unfolds like morning light over quiet hills.`,
      `Do not hurry your hands before your mind is calm. Smoothness creates rhythm, and rhythm generates effortless velocity.`,
      `Practice with purpose and celebrate small improvements. The journey toward excellence is shaped by steady daily steps rather than sudden leaps.`,
      `When you focus fully on the task at hand, distractions fade away. Calm dedication transforms ordinary practice into exceptional ability.`,
      `Every master was once a beginner who refused to surrender. Consistent dedication bridges the distance between ambition and achievement.`
    ],
    Medium: [
      `Excellence is not an extraordinary act, but the accumulation of small disciplines repeated with unwavering focus. Each keystroke shapes the craft of mastery.`,
      `The craftsman finds peace in repetition, knowing that every single iteration polishes away rough edges. Great works are never rushed into being; they are cultivated through sustained attention.`,
      `Mastery is neither a destination nor a single achievement, but an enduring dialogue between intention and execution. In silent practice, we discover the architecture of our potential.`,
      `Resilience is forged when we view unexpected obstacles not as roadblocks, but as invitations to deepen our resolve and refine our technique with quiet poise.`,
      `True concentration requires the courage to silence superficial noise and dedicate oneself entirely to the unfolding rhythm of meaningful creative labor.`,
      `To build lasting proficiency, one must embrace the humility of the novice alongside the rigorous discipline of the dedicated professional scholar.`
    ],
    Hard: [
      `The intellect constructs systems, but relentless patience refines them. When clarity guides each effort, complexity dissolves into quiet understanding and lasting craftsmanship.`,
      `To sculpt enduring skill from chaotic enthusiasm requires the forge of disciplined temperance. Those who embrace rigorous repetition illuminate the hidden pathways where technique ascends into art.`,
      `Wisdom resides not in the avoidance of cognitive strain, but in the deliberate embrace of difficult frontiers where intellect and perseverance synthesize profound insight.`,
      `The cadence of profound mastery demands unwavering vigilance over subtle nuances that casual observers overlook, transforming modest endeavors into enduring monuments of craftsmanship.`,
      `Equanimity under intense pressure distinguishes the seasoned practitioner from the novice, preserving analytical clarity when external circumstances seem most turbulent.`,
      `In the crucible of sustained deliberate practice, self-doubt dissolves before methodical execution, revealing the limitless elasticity of focused human capability.`
    ]
  },
  Literature: {
    Easy: [
      `The early morning mist drifted softly across the cobblestone streets. Quiet lanterns flickered against the damp brick walls as the ancient harbor awoke to the calls of gulls and the rustle of sails in the autumn breeze.`,
      `A gentle autumn rain tapped steadily against the tall library window panes. Inside, the quiet warmth of a crackling hearth illuminated rows of gilded leather-bound volumes that smelled of cedar and time.`,
      `Sunlight filtered through the golden leaves of the apple orchard, casting dancing shadows upon the stone walkway. In the distance, church bells resonated across the peaceful countryside.`,
      `A quiet village nestled between two rolling green hills, where wooden footbridges crossed crystal streams and wild roses bloomed along whitewashed garden fences.`,
      `The old wooden boat rocked gently upon the mirrored surface of the mountain lake. Overhead, white clouds drifted across an azure sky as morning swallows dipped low over the water.`,
      `Night fell upon the forest cottage with the soft scent of pine needles and damp earth. A solitary candle burned in the window, guiding travelers back home.`
    ],
    Medium: [
      `Shadows lengthened across the quiet courtyard as autumn amber leaves swirled in the twilight. From the library tower, clock chimes echoed across the stone arches, measuring hours against the backdrop of an evening sky washed in indigo and gold.`,
      `The midnight train rumbled steadily along the frost-covered valley. Inside the passenger compartment, steam rose from porcelain tea cups while outside, distant farmhouses glowed like solitary amber lanterns amidst vast pine forests.`,
      `Salt spray drifted over the wooden railing of the old schooner as dawn broke upon the horizon. Gilded clouds parted to reveal sapphire waters extending beyond the reach of memory.`,
      `Beneath the vaulted ceilings of the ancient conservatory, climbing jasmine blossomed among rusted iron trelliswork, infusing the humid evening air with sweet floral perfumes.`,
      `The solitary lighthouse keeper watched the tempest churn the northern sea into white foam. Through swirling sheets of sleet, the sweeping amber beam carved a faithful path through the dark.`,
      `In the heart of the bustling marketplace, an artisan carefully painted miniature landscapes onto lacquer tea boxes, surrounded by the aromatic haze of roasted spices and blooming teas.`
    ],
    Hard: [
      `Beyond the desolate moorland, wind carved hollow anthems through fractured granite spires. Night settled in velvet obsidian layers, extinguishing the final embers of crimson dusk while solitary travelers navigated by the cold luminescence of ancient constellations.`,
      `Within the labyrinthine corridors of the forgotten archive, dust motes drifted like suspended memories through shafts of pale morning sun. Generations of forgotten cartographers had charted kingdoms that now existed only upon parchment.`,
      `The subterranean river wound silently beneath monolithic limestone arches, where stalactites hung like inverted cathedrals and iridescent mineral waters reflected centuries of undisturbed silence.`,
      `Over centuries, the sprawling coastal citadel had absorbed the relentless assault of tide and tempest, its weathered sandstone parapets standing as silent sentinels above the surging breakers.`,
      `The scholar unrolled the fragile papyrus scroll beneath the flickering tallow lamp, tracing faded calligraphic script that recorded celestial eclipses observed by astronomers before antiquity fell.`,
      `Twilight settled over the ruined amphitheater like an azure shroud, where fractured marble columns cast elongated shadows across wild lavender growing in forgotten orchestra rings.`
    ]
  },
  'Science & Nature': {
    Easy: [
      `Photosynthesis is the chemical process by which green plants transform sunlight into energy. Chlorophyll absorbs light, enabling plants to convert carbon dioxide and water into oxygen and glucose, sustaining ecosystems across our planet.`,
      `The solar system consists of eight planets orbiting our central star, the Sun. From rocky worlds like Mars to gas giants like Jupiter, each celestial body offers unique insights into the origin and evolution of our cosmic neighborhood.`,
      `Honeybees communicate the location of distant flower patches through an intricate waggle dance. By aligning their movements with the angle of the sun, scout bees guide the entire hive to rich nectar sources with astonishing mathematical precision.`,
      `Coral reefs are vibrant underwater ecosystems built by colonies of tiny marine animals. They provide essential shelter and feeding grounds for thousands of fish species while protecting coastlines from powerful ocean waves.`,
      `Glaciers are massive rivers of compressed ice that move slowly across mountain valleys. Over thousands of years, their immense weight carves dramatic cliffs, deep fjords, and fertile plains across continents.`,
      `Migratory birds navigate across thousands of miles each spring using Earth's magnetic field and celestial landmarks, returning accurately to the exact nesting grounds of their ancestors.`
    ],
    Medium: [
      `The James Webb Space Telescope observes the cosmos using infrared sensors capable of peering through cosmic dust clouds. By detecting redshifted light from ancient galaxies formed over thirteen billion years ago, astronomers study stellar nurseries and planetary atmospheres.`,
      `Geothermal energy taps into the immense heat generated deep within the Earth's mantle and core. Naturally circulating underground aquifers produce high-pressure steam that spins turbines, supplying sustainable electrical power with minimal greenhouse gas emissions.`,
      `Mycelial networks weave through forest soils in vast microscopic webs, exchanging vital nitrogen and phosphorus with tree roots in return for photosynthetic sugars. This fungal subterranean network acts as an organic communicative circulatory system for woodlands.`,
      `Oceanic hydrothermal vents support chemosynthetic ecosystems independent of solar energy. Extremophilic bacteria oxidize sulfur compounds emitted from mineral chimneys, providing organic nutrients for tube worms, ghost crabs, and blind shrimp.`,
      `Plate tectonics governs the dynamic movement of continental and oceanic crustal plates across the asthenosphere. Subduction zones drive volcanic island arcs, while seafloor spreading at midocean ridges continually regenerates oceanic lithosphere.`,
      `The aurora borealis results from solar wind plasma colliding with gases in Earth's upper thermosphere. Ionized oxygen and nitrogen emit vibrant green and violet curtains of luminescence along geomagnetic field lines.`
    ],
    Hard: [
      `Quantum entanglement demonstrates non-local correlations between paired particles whose quantum states cannot be described independently. When measurements collapse the wave function of one particle, its counterpart exhibits instantaneous correlation regardless of spatial separation.`,
      `CRISPR-Cas9 gene editing exploits bacterial adaptive immune mechanisms to introduce site-specific double-stranded DNA breaks. Guided by single-guide RNA sequences, molecular biologists modify targeted genomic loci to decipher fundamental epigenetic pathways.`,
      `Thermodynamic entropy dictates that closed physical systems spontaneously evolve toward states of maximum statistical disorder. In biological organisms, open metabolic flows of energy continually counteract entropic decay to preserve structural complexity.`,
      `Stellar nucleosynthesis within the compressive cores of massive supergiant stars fuses progressively heavier nuclei from carbon up to iron. When radiative pressure can no longer balance gravitational collapse, core-collapse supernovae disperse heavy elements across the interstellar medium.`,
      `Epigenetic regulation orchestrates differential gene transcription through chromatin remodeling, DNA methylation, and histone post-translational acetylation, enabling genetically identical cells to differentiate into specialized somatic tissues.`,
      `Gravitational wave observatories employ laser interferometry across multi-kilometer orthogonal arms to detect infinitesimal metric perturbations in spacetime caused by binary neutron star mergers millions of light-years away.`
    ]
  },
  'Random Text': {
    Easy: [
      `Learning new skills requires daily consistency rather than occasional intense bursts. Setting aside twenty minutes each morning builds lasting habits, sharpens focus, and transforms complex challenges into natural routines over time.`,
      `The art of bread making requires only flour, water, salt, and patient time. As sourdough cultures ferment, wild yeasts develop complex flavors and delicate airy textures that commercial bakeries struggle to reproduce.`,
      `Cycling through city parks offers a rejuvenating blend of physical movement and mental clarity. Fresh morning air and rhythmic pedaling clear away cognitive fatigue, leaving typists and thinkers feeling renewed for the day ahead.`,
      `Pottery begins with damp clay centered upon a revolving wheel. Gentle hand pressure guides the spinning earth upward into symmetrical bowls and pitchers, marrying functional utility with tactile artistic expression.`,
      `Gardening teaches patience and attentive care. Sowing heirloom seeds in rich compost and providing daily sunlight rewards growers with vibrant blossoms, fragrant herbs, and crisp vegetables harvested at peak ripeness.`,
      `Listening closely to instrumental music enhances concentration and emotional balance. Harmonious melodies stimulate creative problem solving and provide a calming backdrop for quiet evening study and reflection.`
    ],
    Medium: [
      `Urban architecture continually evolves to balance aesthetic heritage with environmental sustainability. Modern cities integrate vertical gardens, energy-efficient transit systems, and communal public spaces that foster creativity and human connection.`,
      `The craft of traditional watchmaking demands microscopic precision and steady hands. Hundreds of delicate gears, springs, and synthetic ruby bearings must synchronize harmoniously to measure seconds with enduring acoustic poise.`,
      `Exploring unfamiliar literary genres broadens empathetic understanding and creative problem-solving. When readers immerse themselves in different cultural perspectives, they discover universal human aspirations beneath diverse historical backgrounds.`,
      `The evolution of cartography mirrors humanity's expanding curiosity about the physical world. Ancient mariners charted coastlines using sextants and stellar positions, laying foundational geodetic knowledge for satellite navigation systems.`,
      `Coffee cultivation spans volcanic mountain slopes across equatorial regions. Hand-harvested cherries undergo careful washing, patio drying, and artisan roasting to unlock subtle aromatic tasting notes of citrus and dark chocolate.`,
      `Typography bridges the boundary between linguistic communication and visual aesthetics. The careful selection of serifs, tracking, and leading shapes the subconscious rhythm with which readers absorb written thoughts.`
    ],
    Hard: [
      `The preservation of cognitive agility relies on deliberate perceptual challenges and diverse intellectual pursuits. Embracing unfamiliar problem domains synthesizes new neural pathways, fortifying analytical endurance and creative resilience against routine stagnation.`,
      `Architectural acousticians sculpt auditorium geometries using calculated reflective paneling and sound-dampening textiles to orchestrate spatial reverberation decay times, ensuring symphonic overtones bloom with pristine spectral fidelity.`,
      `The historiography of ancient Silk Road caravans demonstrates how cross-continental trade routes facilitated not merely mercantile commerce, but the profound syncretic diffusion of astronomical manuscripts, philosophical treatises, and metallurgy.`,
      `Linguistic typology examines structural universals and phonetic divergences across global language families, revealing how grammatical morphology reflects cognitive categorizations of spatial relationships and temporal aspect.`,
      `Classical printmaking techniques, including copperplate intaglio and multi-block Japanese woodcut xylography, demand rigorous chemical mastery of acid mordants alongside exquisite subtractive carving dexterity.`,
      `The philosophy of mind investigates whether subjective phenomenological qualia can be comprehensively reconciled with reductionist neurochemical substrate models, fueling enduring ontological debates across computational cognitive science.`
    ]
  },
  Medical: {
    Easy: [
      `Medical billing specialists submit insurance claims using standard CMS-1500 forms. Each claim lists the patient name, date of birth, policy identification number, and primary diagnosis code. Accurate data entry ensures quick reimbursement from commercial health plans and government payers.`,
      `Patient registration gathers essential contact details, primary insurance coverage, and emergency contacts. Front desk staff verify active policy status before the patient meets with their attending physician. Clear demographic intake prevents billing delays and reduces unpaid claims.`,
      `Medical terminology helps doctors, nurses, and billing teams communicate clearly. Common prefixes and suffixes describe symptoms, body parts, and surgical procedures. Learning terms like hypertension, arthritis, and tachycardia builds strong medical vocabulary skills.`,
      `Insurance verification confirms patient benefits, copay amounts, and deductible balances prior to scheduled clinic visits. Billing clerks check whether outpatient services require prior authorization from the health insurance carrier.`,
      `Payment posting records patient copayments and insurance remittances onto active accounts. Billing specialists compare explanation of benefits statements against total charges to ensure accurate patient statement balances.`,
      `Electronic health record systems store clinical progress notes, laboratory test orders, and physician discharge summaries. Standardized documentation ensures seamless coordination of care across primary care clinics and hospital networks.`
    ],
    Medium: [
      `Medical billing and claims processing requires meticulous attention to service dates, National Provider Identifiers (NPI), and diagnosis pointer assignments. When submitting electronic claims via EDI 837 formats, billing coordinators verify that primary and secondary coverage guidelines adhere to standard coordination of benefits. If a payer issues a denial for missing documentation or unbundled service lines, billers initiate formal appeals containing certified clinical records within timely filing deadlines.`,
      `Diagnostic coding translates clinical assessments into standardized ICD-10-CM alphanumeric codes. A patient presenting with uncontrolled type 2 diabetes mellitus is coded as E11.65, while essential primary hypertension is classified under code I10. Corresponding procedural services are coded using CPT classifications such as 99214 for level four established office visits. Proper modifier usage, such as modifier 25 for significant separate evaluations, prevents erroneous claim rejections.`,
      `Health insurance verification specialists evaluate policy effective dates, remaining annual deductibles, and co-insurance percentages. For high-cost diagnostic imaging like MRI or CT scans, pre-certification must be secured from the insurer's utilization management department. Documenting the authorization reference number directly into the patient's billing encounter ensures prompt claims adjudication without patient financial liability.`,
      `Patient data entry clerks input detailed intake records into electronic practice management software. Typical fields include patient name, subscriber policy ID #W84920184, guarantor address, date of injury, and primary care referral numbers. Meticulous keyboarding precision eliminates duplicate patient accounts and guarantees that electronic billing clearinghouses accept initial batch transmissions without rejection.`,
      `Payment posting workflows involve reconciling electronic remittance advice (ERA 835) files against daily bank deposits. Biller specialists post contractual write-offs, secondary insurance adjustments, and patient responsibility balances. Accounts receivable (A/R) teams track aging buckets at 30, 60, and 90 days to identify unpaid claims, follow up with third-party insurance adjusters, and resolve credit balances.`,
      `Clinical medical documentation relies on structured SOAP progress notes. The subjective section outlines the patient chief complaint, the objective records vital signs and laboratory findings, the assessment provides diagnostic evaluation, and the plan details therapeutic medications and follow-up intervals. Physicians digitally sign completed encounter notes to maintain strict regulatory compliance with HIPAA privacy standards.`
    ],
    Hard: [
      `Revenue cycle management in hospital outpatient settings mandates rigorous adherence to National Correct Coding Initiative (NCCI) procedure-to-procedure edits and medically unlikely edits (MUE). When processing surgical billing encounters, billing coders assign CPT code 43239 for esophagogastroduodenoscopy with biopsy alongside primary ICD-10-CM diagnosis code K21.9 for gastroesophageal reflux disease. Billing scrubbers validate that line-item charges of $2,450.00 include provider NPI #1982736450, facility Tax ID #84-3829104, and appropriate revenue code 0360 for operating room services. If the commercial payer remits an ERA 835 with denial remark code CO-16 indicating missing pre-authorization, accounts receivable specialists submit redetermination appeals complete with operative notes, pathology reports, and pre-admission certification approval #AUTH-99482 within the mandatory sixty-day timely filing window.`,
      `Complex medical data entry and payment posting requires rapid typing of mixed alphanumeric codes, currency figures, and clinical dates. Account summary reconciliation for patient MRN #948201 reveals total charges of $4,850.00 for outpatient arthroscopy on 04/15/2026. The primary insurer remitted payment of $3,120.00 with contractual adjustment of $1,180.00 under policy #GRP-8472-01. The secondary payer processed the remaining balance, leaving a final patient deductible obligation of $150.00 and specialist copay of $40.00. Billing clerks balance daily cash ledgers by cross-referencing batch deposit slips with clearinghouse settlement reports, ensuring zero discrepancy between merchant credit card transactions and electronic health record ledger postings.`,
      `Professional healthcare documentation and diagnostic terminology encompass complex multisystem pathology. Clinical consultation notes document patient history of coronary artery disease status-post percutaneous transluminal coronary angioplasty with drug-eluting stent placement in the left anterior descending artery. Physical examination notes bilateral lower extremity pitting edema, jugular venous distention, and diminished vesicular breath sounds across pulmonary lung bases. Diagnostic workup specifies brain natriuretic peptide levels exceeding 850 pg/mL, complete blood count demonstrating normocytic anemia with hemoglobin 10.2 g/dL, and echocardiogram indicating left ventricular ejection fraction of 35%. Medical record specialists review physician chart documentation to ensure compliance with Medicare Part B documentation guidelines prior to releasing final hospital billing statements.`,
      `Insurance verification protocols for surgical specialty clinics demand rigorous validation of subscriber group benefit plans, lifetime maximums, and tiered formulary coverage. Prior to scheduling orthopedic joint reconstruction, verification coordinators interface with payer clearinghouses to determine whether the patient has satisfied their $3,000.00 family deductible and $6,500.00 out-of-pocket threshold. Benefit summaries indicate 80% in-network coinsurance coverage after deductible, requiring a mandatory patient pre-service deposit of $650.00. Verification notes must record the claims submission mailing address, payer electronic ID #84920, claims adjuster direct extension, and formal pre-determination case number #CASE-2026-7718 to safeguard practice cash flow against unexpected retro-terminations.`,
      `ICD-10-CM and CPT procedural coding for multispecialty encounters involves hierarchical condition category (HCC) risk adjustment documentation and modifier precision. Coders review encounter notes to assign CPT 99215 for high-complexity medical decision making, appending modifier 25 to report concurrent joint arthrocentesis represented by CPT 20610. Diagnostic linkages connect ICD-10-CM M17.11 for primary osteoarthritis of the right knee and E11.40 for type 2 diabetes with diabetic neuropathy. Billing analysts audit high-volume clearinghouse rejection logs to detect patterns of mismatched diagnostic pointers, ensuring clean claim acceptance rates consistently surpass the ninety-eight percent industry standard.`,
      `Medical documentation audit workflows verify that clinician electronic signatures, time stamps, and amendments meet federal Centers for Medicare & Medicaid Services (CMS) guidelines. Every addendum to the electronic health record must detail the clinical rationale, date of correction, and authenticated staff credentials. Compliance officers inspect billing records to verify that billed evaluation levels correlate with medical necessity, preventing compliance risks associated with chart upcoding while ensuring comprehensive documentation of complex chronic comorbidities.`
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
function buildPrompt(category, difficulty, language, durationSeconds, excludeText = '', medicalSubcategory = '') {
  const durSec = Number(durationSeconds) || 60;
  const durMin = durSec / 60;
  const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  // Precise Target Word Count Scale:
  // 1 minute (60s): 100–150 words (Easy: 105, Medium: 125, Hard: 145)
  // 2 minutes (120s): 200–300 words (Easy: 210, Medium: 250, Hard: 290)
  // 3 minutes (180s): 300–450 words (Easy: 320, Medium: 375, Hard: 435)
  // 5 minutes (300s): 500–750 words (Easy: 525, Medium: 625, Hard: 725)
  // Custom: calculated dynamically (105-145 words/min) with sensible min/max limits
  let targetWords = 125;
  let targetLines = 14;

  if (Math.abs(durSec - 60) < 5) {
    targetWords = difficulty === 'Easy' ? 105 : difficulty === 'Hard' ? 145 : 125;
    targetLines = difficulty === 'Easy' ? 10 : difficulty === 'Hard' ? 16 : 13;
  } else if (Math.abs(durSec - 120) < 5) {
    targetWords = difficulty === 'Easy' ? 210 : difficulty === 'Hard' ? 290 : 250;
    targetLines = difficulty === 'Easy' ? 18 : difficulty === 'Hard' ? 28 : 23;
  } else if (Math.abs(durSec - 180) < 5) {
    targetWords = difficulty === 'Easy' ? 320 : difficulty === 'Hard' ? 435 : 375;
    targetLines = difficulty === 'Easy' ? 26 : difficulty === 'Hard' ? 40 : 33;
  } else if (Math.abs(durSec - 300) < 5) {
    targetWords = difficulty === 'Easy' ? 525 : difficulty === 'Hard' ? 725 : 625;
    targetLines = difficulty === 'Easy' ? 42 : difficulty === 'Hard' ? 66 : 54;
  } else {
    // Custom / Open-ended duration:
    const clampedMin = Math.max(0.5, Math.min(15, durMin));
    const wordsPerMin = difficulty === 'Easy' ? 105 : difficulty === 'Hard' ? 145 : 125;
    targetWords = Math.max(60, Math.min(2000, Math.round(clampedMin * wordsPerMin)));
    targetLines = Math.max(8, Math.min(180, Math.round(clampedMin * 12)));
  }

  // Difficulty-based guidelines:
  let difficultyGuideline = '';
  if (difficulty === 'Easy') {
    difficultyGuideline = 'DIFFICULTY: EASY - Use common words and simple sentence structures. Keep sentences short and clear with basic punctuation (periods, commas). Generate towards the lower end of the target word-count range.';
  } else if (difficulty === 'Medium') {
    difficultyGuideline = 'DIFFICULTY: MEDIUM - Use moderately complex sentences and broader vocabulary. Include standard punctuation (commas, semicolons, hyphens) and well-developed paragraphs. Generate towards the middle of the target word-count range.';
  } else {
    difficultyGuideline = 'DIFFICULTY: HARD - Use advanced vocabulary, complex sentence structures, longer polysyllabic words, and challenging punctuation. Generate demanding content appropriate to the category, towards the upper end of the target word-count range.';
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

  // Medical Category
  if (category === 'Medical') {
    const medPools = SUBTOPIC_POOLS.Medical;
    const subcatName = (medicalSubcategory && medPools[medicalSubcategory]) ? medicalSubcategory : 'Medical Billing & Claims';
    const topics = medPools[subcatName] || medPools['Medical Billing & Claims'];
    subtopic = topics[Math.floor(Math.random() * topics.length)];

    let medFocus = '';
    let specialGuidance = '';
    if (subcatName === 'Medical Billing & Claims') {
      medFocus = 'claim submission protocols, CMS-1500 and UB-04 forms, billing adjudication, clean claim metrics, service dates, and timely filing compliance';
      specialGuidance = 'Include authentic billing terminology such as CMS-1500, EDI 837, timely filing limits, claim denials, and prior authorizations.';
    } else if (subcatName === 'Medical Terminology') {
      medFocus = 'medical vocabulary, disease diagnoses, clinical signs, anatomical terms, and healthcare terminology';
      specialGuidance = 'Incorporate rich, multi-syllable medical vocabulary, anatomical terminology, and formal diagnostic descriptions.';
    } else if (subcatName === 'ICD-10-CM & CPT Coding') {
      medFocus = 'alphanumeric diagnosis codes, evaluation and management CPT codes, procedure modifiers, decimal points, and coding accuracy';
      specialGuidance = 'Seamlessly integrate realistic alphanumeric codes with decimal points (e.g., ICD-10-CM E11.9, I10, CPT 99213, 99214-25) into flowing prose.';
    } else if (subcatName === 'Insurance Verification') {
      medFocus = 'patient insurance eligibility, primary vs secondary coverage, policy dates, deductibles, copayments, coinsurance, and prior authorizations';
      specialGuidance = 'Feature insurance terms such as deductible, copayment, coinsurance, in-network benefits, pre-authorization, and coordination of benefits.';
    } else if (subcatName === 'Patient Data Entry') {
      medFocus = 'fictional patient demographics, medical record numbers, birth dates, provider identifiers, registration records, and intake fields';
      specialGuidance = 'Include structured patient intake references, dates of birth (DOB), MRN identifiers, guarantor records, and registration details.';
    } else if (subcatName === 'Payment Posting & Accounts Receivable') {
      medFocus = 'electronic remittance advice, explanation of benefits reconciliation, payment posting, aging buckets, contractual adjustments, and balances';
      specialGuidance = 'Integrate payment reconciliation concepts like ERA 835, EOB write-offs, A/R aging buckets, credit balances, and patient statements.';
    } else if (subcatName === 'Medical Documentation') {
      medFocus = 'professional clinical documentation, SOAP progress notes, physician chart notes, discharge summaries, and healthcare record workflows';
      specialGuidance = 'Reflect professional clinical administrative documentation, SOAP note components (subjective, objective, assessment, plan), and HIPAA chart compliance.';
    } else if (subcatName === 'Numbers & Special Characters') {
      medFocus = 'formatted medical data featuring numbers, currency amounts ($), dates (MM/DD/YYYY), code modifiers (-), percentages (%), and alphanumeric IDs';
      specialGuidance = 'Liberally include realistic typing numbers, currency signs ($1,250.00), service dates (04/18/2026), percentages (20%), and identifiers (#84920).';
    } else {
      medFocus = 'healthcare systems, clinical workflows, patient wellness, and clinical medicine';
    }

    const antiRepeatDirective = excludeText
      ? `DO NOT reuse or repeat anything similar to this previous passage: "${excludeText.slice(0, 80)}..."`
      : 'Ensure this passage is completely unique and different from previous responses.';

    const durationText = `${durationSeconds}s (${Math.max(1, Math.round(durationSeconds / 60))} min)`;

    return `Generate a clear, high-legibility medical typing passage for a typing test. Duration target: ${durationText}, Difficulty: ${difficulty}, Category: Medical (${subcatName}). Return plain text only without markdown formatting.

You are a professional typing test passage generator specializing in healthcare administration, medical billing, and clinical content.
Category: Medical
Medical Subcategory: ${subcatName} (${medFocus})
Difficulty: ${difficulty}
Specific Topic Focus: ${subtopic}
Target Length: Approximately ${targetWords} words (calibrated for a ${durationText} typing test session).
Unique Entropy Seed: ${seed}

${difficultyGuideline}

Instructions:
Write an authentic, highly educational passage focusing on ${subcatName}, specifically exploring: ${subtopic}. ${specialGuidance} Maintain high legibility and natural typing flow while adjusting vocabulary and complexity to match ${difficulty} difficulty.

CRITICAL RULES:
1. Return ONLY raw continuous paragraph text (flowing prose paragraphs).
2. Word count target is approximately ${targetWords} words. It is crucial to reach this length so the user has sufficient text for their ${durationText} test.
3. DO NOT format as a numbered list, bullet points, or dictionary list.
4. ${antiRepeatDirective}
5. DO NOT use markdown code fences, headers, or quotation marks wrapping the passage.
6. DO NOT include conversational filler like "Here is your passage" or explanations.
7. Return ONLY the typing passage ready for immediate character-by-character typing.`;
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
Target Length: Approximately ${targetWords} words (calibrated for a ${durationText} typing test session).
Unique Entropy Seed: ${seed}

${difficultyGuideline}

Instructions:
${domainInstructions}

CRITICAL RULES:
1. Return ONLY raw continuous paragraph text (flowing prose paragraphs).
2. Target word count is approximately ${targetWords} words. Provide sufficient text to sustain the ${durationText} session.
3. DO NOT format as a numbered list, bullet points, or list of words.
4. ${antiRepeatDirective}
5. DO NOT use markdown code fences, headers, bullet points, or quotation marks wrapping the entire passage.
6. DO NOT include introductory phrases like "Here is your passage" or explanations.
7. Provide varied, natural punctuation suitable for ${difficulty} typing practice.`;
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

let lastGeneratedCategory = '';
let lastFallbackCategory = '';

// Rotating Fallback Bank guaranteed to never repeat the same passage
export function getFallbackPassage(category, difficulty, language, excludeText = '', durationSeconds = 60, medicalSubcategory = '') {
  let cat = ALLOWED_CATEGORIES.includes(category) ? category : 'Random Text';
  const diff = ALLOWED_DIFFICULTIES.includes(difficulty) ? difficulty : 'Medium';

  let selectedCat = cat;
  if (cat === 'Random Text') {
    const candidateCategories = ['Technology', 'Quotes', 'Literature', 'Science & Nature', 'Medical', 'Random Text'];
    const availableCategories = candidateCategories.filter(c => c !== lastFallbackCategory);
    selectedCat = availableCategories[Math.floor(Math.random() * availableCategories.length)] || candidateCategories[0];
    lastFallbackCategory = selectedCat;
  }

  let passageList = [];

  let currentBank = null;
  if (selectedCat === 'Programming') {
    const lang = ALLOWED_LANGUAGES.includes(language) ? language : 'C';
    currentBank = FALLBACK_BANK.Programming[lang] || FALLBACK_BANK.Programming.C;
    passageList = currentBank[diff] || currentBank.Easy;
  } else {
    currentBank = FALLBACK_BANK[selectedCat] || FALLBACK_BANK['Random Text'];
    passageList = currentBank[diff] || currentBank.Medium;
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

  let selected = candidates[Math.floor(Math.random() * candidates.length)];

  // Scale fallback passage length if duration is long (1m: 100-150w, 2m: 200-300w, 3m: 300-450w, 5m: 500-750w)
  const durSec = Number(durationSeconds) || 60;
  const targetMinWords = durSec >= 300 ? 525 : durSec >= 180 ? 320 : durSec >= 120 ? 210 : 105;
  let wordCount = selected.trim().split(/\s+/).length;
  let attempts = 0;
  const pool = [
    ...(Array.isArray(passageList) ? passageList : []),
    ...(currentBank?.Hard || []),
    ...(currentBank?.Medium || []),
    ...(currentBank?.Easy || [])
  ].filter(Boolean);

  while (wordCount < targetMinWords && attempts < 25) {
    const nextCandidate = pool[(attempts + 1) % pool.length];
    if (nextCandidate && (!selected.includes(nextCandidate) || attempts > pool.length)) {
      selected = `${selected} ${nextCandidate}`;
      wordCount = selected.trim().split(/\s+/).length;
    }
    attempts++;
  }

  recordServedPassage(selected);
  return selected;
}

// Call Google Gemini API with multi-model auto-failover and zero-repeat guarantees
export async function generateTextWithGemini({
  category = 'Random Text',
  difficulty = 'Medium',
  language = 'C',
  medicalSubcategory = 'General Medical',
  durationSeconds = 60,
  excludeText = '',
  apiKey: clientApiKey = '',
  model: clientModel = ''
}) {
  const internalConfig = getInternalGeminiConfig();
  const rawClientKey = (clientApiKey || '').trim();
  const apiKey = (rawClientKey && !rawClientKey.includes('•') && rawClientKey.length > 10)
    ? rawClientKey
    : (internalConfig.apiKey || '');
  const preferredModel = (clientModel || '').trim() || internalConfig.model || 'gemini-3.5-flash';
  const durSec = Number(durationSeconds) || 60;

  // When category is 'Random Text', dynamically sample a fresh category across all domains on every click, avoiding repetition
  let effectiveCategory = category;
  let effectiveMedicalSub = medicalSubcategory;

  if (category === 'Random Text') {
    const candidateDomains = ['Technology', 'Quotes', 'Literature', 'Science & Nature', 'Medical'];
    const availableDomains = candidateDomains.filter(d => d !== lastGeneratedCategory);
    effectiveCategory = availableDomains[Math.floor(Math.random() * availableDomains.length)] || candidateDomains[0];
    lastGeneratedCategory = effectiveCategory;

    if (effectiveCategory === 'Medical') {
      const medSubs = [
        'Medical Billing & Claims',
        'Medical Terminology',
        'ICD-10-CM & CPT Coding',
        'Insurance Verification',
        'Patient Data Entry',
        'Payment Posting & Accounts Receivable',
        'Medical Documentation',
        'Numbers & Special Characters'
      ];
      effectiveMedicalSub = medSubs[Math.floor(Math.random() * medSubs.length)];
    }
  }

  if (!apiKey) {
    console.warn('[GeminiService] No Gemini API key provided. Serving rotating verified fallback.');
    const fallbackText = getFallbackPassage(effectiveCategory, difficulty, language, excludeText, durSec, effectiveMedicalSub);
    return {
      success: true,
      category,
      generatedCategory: effectiveCategory,
      difficulty,
      language: effectiveCategory === 'Programming' ? language : undefined,
      medicalSubcategory: effectiveCategory === 'Medical' ? effectiveMedicalSub : undefined,
      text: fallbackText,
      source: 'fallback_bank',
      notice: 'Gemini API key not configured; using local verified category bank.'
    };
  }

  const promptContent = buildPrompt(effectiveCategory, difficulty, language, durSec, excludeText, effectiveMedicalSub);

  // Generous maxOutputTokens with thinkingBudget: 0 ensures the model does not truncate prose mid-sentence
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
      temperature: 0.85,
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  };

  // Determine models to try, placing chosen model first
  const activeCandidateModels = [
    preferredModel,
    ...CANDIDATE_MODELS.filter((m) => m !== preferredModel)
  ];

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
        signal: AbortSignal.timeout(12000) // 12s timeout per model
      });

      if (response.ok) {
        const parsed = await response.json();
        const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanText = sanitizeGeneratedText(candidateText, effectiveCategory);

        // Ensure text is valid, not empty, and not identical to current text
        if (cleanText && cleanText.length > 15 && cleanText !== excludeText && !isRecentlyServed(cleanText)) {
          recordServedPassage(cleanText);
          return {
            success: true,
            category,
            generatedCategory: effectiveCategory,
            difficulty,
            language: effectiveCategory === 'Programming' ? language : undefined,
            medicalSubcategory: effectiveCategory === 'Medical' ? effectiveMedicalSub : undefined,
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
            generatedCategory: effectiveCategory,
            difficulty,
            language: effectiveCategory === 'Programming' ? language : undefined,
            medicalSubcategory: effectiveCategory === 'Medical' ? effectiveMedicalSub : undefined,
            text: cleanText,
            source: 'gemini_api',
            modelUsed: model
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[GeminiService] Model ${model} responded with ${response.status}: ${errJson.error?.message?.slice(0, 80) || ''}. Trying next candidate model.`);
      }
    } catch (err) {
      console.warn(`[GeminiService] Model ${model} error (${err.message}). Trying next candidate model.`);
    }
  }

  // If all live models hit rate-limits or network failure, rotate to non-repeating fallback passage
  console.log('[GeminiService] Serving non-repeating verified fallback passage.');
  const fallbackText = getFallbackPassage(effectiveCategory, difficulty, language, excludeText, durSec, effectiveMedicalSub);
  return {
    success: true,
    category,
    generatedCategory: effectiveCategory,
    difficulty,
    language: effectiveCategory === 'Programming' ? language : undefined,
    medicalSubcategory: effectiveCategory === 'Medical' ? effectiveMedicalSub : undefined,
    text: fallbackText,
    source: 'fallback_bank'
  };
}

// ==========================================================
// REAL-TIME AI CHATBOT WITH GEMINI
// Context-Aware, Rate-Limited, Role & Portal Governed
// ==========================================================
export async function chatWithGemini({
  messages = [],
  userRole = 'user',
  portal = 'user',
  userProfile = null,
  clientIp = 'localhost'
}) {
  if (!checkRateLimit(`chat_${clientIp}`)) {
    return {
      success: false,
      error: 'Rate limit reached. Please wait a moment before sending another message.'
    };
  }

  const { apiKey, model: activeModel } = getInternalGeminiConfig();

  if (!apiKey) {
    return {
      success: false,
      error: 'TypeMaster AI Assistant is not configured yet. Please configure the Gemini API Key in Admin Settings.'
    };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      success: false,
      error: 'No messages provided.'
    };
  }

  const userGreeting = userProfile?.displayName || userProfile?.username || (userRole === 'admin' ? 'Administrator' : 'Typist');
  const systemPrompt = `You are "TypeMaster AI Assistant", a smart, friendly, and expert typing coach and platform guide built into the TypeMaster application.

Platform & Domain Knowledge:
- Core Purpose: Helping users test, practice, and build muscle memory for professional typing speed, accuracy, and ergonomic endurance.
- Key Metrics:
  * WPM (Words Per Minute): Standard formula is (Total characters typed / 5) / (Time in minutes).
  * Net WPM: Gross WPM minus (Uncorrected errors / Time in minutes).
  * Accuracy %: ((Total keystrokes - Errors) / Total keystrokes) * 100.
  * Consistency: Smoothness and uniformity of keystroke timing intervals.
- Typing Technique & Ergonomics:
  * Home row posture: Left hand (A-S-D-F), Right hand (J-K-L-;), thumbs resting on the Spacebar.
  * Eyes on the screen, not looking down at keyboard keycaps.
  * Prioritize accuracy over raw speed. Velocity naturally emerges once error rates fall below 3%.
  * Recommended routine: 15-20 minutes of daily deliberate practice with targeted mistake drills.
- Application Navigation & Features:
  * User Portal: Dashboard, Typing Test (1m, 3m, 5m, Custom), Scheduled Tests & Challenges, My Performance, Leaderboard, Progress Trends, Practice Modes (Drills), Test History, Feedback, Settings, Help & Support.
  * New Text Feature: Powered by Google Gemini to dynamically generate unique typing passages across Technology, Quotes, Literature, Programming (C, Python, Java, JS, C++), Science & Nature, and Random Text.
  * Scheduled Tests: Official competitive or classroom assessments with anti-cheat detection (tab-switch tracking and copy-paste blocking).
  * Sound Synthesizer: Cherry Blue clicky, mechanical, typewriter, and silent typing audio feedback.
  * Mistake Review: Highlights missed words and generates targeted practice drills.
  * Admin Portal (Authorized Admins only): User management, scheduled tests configuration, audit logs, announcements, and Gemini AI credentials configuration.

Security & Permissions:
- Current user: ${userGreeting} | Role: ${userRole} | Portal: ${portal}
- Strictly respect user privacy. Never invent, hallucinate, or expose private performance logs or account details of other users.
- Do NOT provide unauthorized administrator access or reveal administrator-only reports, private feedback, or raw database credentials to standard users.
- Provide clear, direct, polite, and encouraging responses with helpful markdown formatting (bullet points, bold highlights) when appropriate. Keep answers focused and concise.`;

  // Format multi-turn conversation history for Gemini API
  const formattedContents = [];
  const recentMessages = messages.slice(-12);

  for (const m of recentMessages) {
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    const text = (m.content || m.text || '').trim();
    if (!text) continue;

    if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
      formattedContents[formattedContents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      formattedContents.push({
        role,
        parts: [{ text }]
      });
    }
  }

  // Ensure conversation starts with user turn
  if (formattedContents.length > 0 && formattedContents[0].role !== 'user') {
    formattedContents.shift();
  }

  if (formattedContents.length === 0) {
    return {
      success: false,
      error: 'Please enter a valid message.'
    };
  }

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };

  const modelsToTry = [
    activeModel || 'gemini-3.5-flash',
    ...CANDIDATE_MODELS.filter((m) => m !== activeModel)
  ];

  let lastErrorMessage = '';

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(12000)
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (replyText.trim()) {
          return {
            success: true,
            reply: replyText.trim(),
            modelUsed: model
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastErrorMessage = errJson.error?.message || `HTTP ${response.status}`;
        console.warn(`[GeminiChat] Model ${model} returned ${response.status}: ${lastErrorMessage}`);
      }
    } catch (err) {
      lastErrorMessage = err.message || 'Request timed out';
      console.warn(`[GeminiChat] Model ${model} request error: ${lastErrorMessage}`);
    }
  }

  return {
    success: false,
    error: lastErrorMessage || 'Unable to contact TypeMaster AI. Please try again.'
  };
}
