export const assessmentQuestions = {
  'technical-skills': {
    testTitle: 'Technical Skills Assessment',
    sections: [
      {
        label: 'Core Concepts',
        questions: [
          {
            id: 'ts-q1',
            text: 'What is the average time complexity of searching for an element in a Hash Table using a well-distributed hash function?',
            points: 2.0,
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
            correct: 0,
          },
          {
            id: 'ts-q2',
            text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
            points: 2.0,
            options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
            correct: 1,
          },
          {
            id: 'ts-q3',
            text: 'What is the worst-case time complexity of QuickSort?',
            points: 2.0,
            options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
            correct: 2,
          },
          {
            id: 'ts-q4',
            text: 'In a Binary Search Tree, which traversal produces a sorted sequence of values?',
            points: 2.0,
            options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
            correct: 2,
          },
        ],
      },
      {
        label: 'Applied Programming',
        questions: [
          {
            id: 'ts-q5',
            text: 'Which HTTP method is idempotent and should be used to fully replace a resource?',
            points: 2.0,
            options: ['POST', 'PATCH', 'PUT', 'DELETE'],
            correct: 2,
          },
          {
            id: 'ts-q6',
            text: 'Which OOP principle restricts direct access to an object\'s internal state?',
            points: 2.0,
            options: ['Inheritance', 'Polymorphism', 'Abstraction', 'Encapsulation'],
            correct: 3,
          },
          {
            id: 'ts-q7',
            text: 'What design pattern ensures a class has only one instance throughout an application lifecycle?',
            points: 2.0,
            options: ['Factory', 'Observer', 'Singleton', 'Decorator'],
            correct: 2,
          },
          {
            id: 'ts-q8',
            text: 'Which collision resolution technique uses a linked list to store multiple elements that hash to the same index?',
            points: 2.0,
            options: ['Linear Probing', 'Separate Chaining', 'Double Hashing', 'Quadratic Probing'],
            correct: 1,
          },
        ],
      },
      {
        label: 'System Design',
        questions: [
          {
            id: 'ts-q9',
            text: 'Which architectural pattern separates an application into three interconnected components: Model, View, and Controller?',
            points: 2.0,
            options: ['Microservices', 'MVC', 'Event-driven', 'Serverless'],
            correct: 1,
          },
          {
            id: 'ts-q10',
            text: 'What is the primary purpose of a load balancer in a distributed system?',
            points: 2.0,
            options: ['Data caching', 'Distributing traffic across servers', 'Database replication', 'Service discovery'],
            correct: 1,
          },
        ],
      },
    ],
  },

  'problem-solving': {
    testTitle: 'Problem Solving Assessment',
    sections: [
      {
        label: 'Logical Reasoning',
        questions: [
          {
            id: 'ps-q1',
            text: 'If all roses are flowers and some flowers are red, which conclusion is definitely true?',
            points: 2.0,
            options: ['All roses are red', 'Some roses may be red', 'No roses are red', 'All flowers are roses'],
            correct: 1,
          },
          {
            id: 'ps-q2',
            text: 'Complete the series: 2, 6, 18, 54, ___',
            points: 2.0,
            options: ['108', '162', '216', '180'],
            correct: 1,
          },
          {
            id: 'ps-q3',
            text: 'A train travels at 60 km/h for 2 hours then at 80 km/h for 3 hours. What is the total distance covered?',
            points: 2.0,
            options: ['280 km', '360 km', '300 km', '420 km'],
            correct: 1,
          },
          {
            id: 'ps-q4',
            text: 'In a row of students, Ram is 7th from the left and 13th from the right. How many students are in the row?',
            points: 2.0,
            options: ['18', '19', '20', '21'],
            correct: 1,
          },
        ],
      },
      {
        label: 'Numerical & Verbal',
        questions: [
          {
            id: 'ps-q5',
            text: 'A shopkeeper marks goods 40% above cost price and gives a 20% discount. What is the profit percentage?',
            points: 2.0,
            options: ['10%', '12%', '15%', '8%'],
            correct: 1,
          },
          {
            id: 'ps-q6',
            text: 'Choose the word most similar in meaning to "ELOQUENT":',
            points: 2.0,
            options: ['Silent', 'Articulate', 'Confused', 'Timid'],
            correct: 1,
          },
          {
            id: 'ps-q7',
            text: 'Water : Thirst :: Food : ___',
            points: 2.0,
            options: ['Drink', 'Cook', 'Hunger', 'Nutrition'],
            correct: 2,
          },
          {
            id: 'ps-q8',
            text: 'What fraction of 2 hours is 20 minutes?',
            points: 2.0,
            options: ['1/4', '1/6', '1/5', '1/3'],
            correct: 1,
          },
        ],
      },
      {
        label: 'Decision Making',
        questions: [
          {
            id: 'ps-q9',
            text: 'A project is 80% complete with 10 days left but requires 15 more working days to finish. What is the best course of action?',
            points: 2.0,
            options: ['Continue as planned', 'Request a deadline extension', 'Reduce quality standards', 'Cancel the project'],
            correct: 1,
          },
          {
            id: 'ps-q10',
            text: 'Which cognitive bias causes people to favor information that confirms their pre-existing beliefs?',
            points: 2.0,
            options: ['Anchoring bias', 'Sunk cost fallacy', 'Confirmation bias', 'Availability heuristic'],
            correct: 2,
          },
        ],
      },
    ],
  },

  'cyber-readiness': {
    testTitle: 'Cyber Readiness Assessment',
    sections: [
      {
        label: 'Network Security',
        questions: [
          {
            id: 'cr-q1',
            text: 'Which attack exploits TCP\'s three-way handshake by sending a large number of SYN packets without completing the connection?',
            points: 2.0,
            options: ['Phishing', 'SYN Flood', 'SQL Injection', 'MITM Attack'],
            correct: 1,
          },
          {
            id: 'cr-q2',
            text: 'What does HTTPS use to ensure secure communication between client and server?',
            points: 2.0,
            options: ['FTP encryption', 'TLS/SSL certificates', 'VPN tunneling', 'Firewall rules'],
            correct: 1,
          },
          {
            id: 'cr-q3',
            text: 'Which OWASP Top 10 vulnerability allows attackers to execute malicious scripts in users\' browsers?',
            points: 2.0,
            options: ['SQL Injection', 'CSRF', 'XSS (Cross-Site Scripting)', 'IDOR'],
            correct: 2,
          },
          {
            id: 'cr-q4',
            text: 'What is the principle of least privilege in cybersecurity?',
            points: 2.0,
            options: [
              'Giving all users admin access',
              'Granting only the minimum access required for a task',
              'Encrypting all user data at rest',
              'Enabling two-factor authentication for all users',
            ],
            correct: 1,
          },
        ],
      },
      {
        label: 'Secure Development',
        questions: [
          {
            id: 'cr-q5',
            text: 'Which hashing algorithm is considered cryptographically broken and should NOT be used for password storage?',
            points: 2.0,
            options: ['bcrypt', 'SHA-256', 'MD5', 'Argon2'],
            correct: 2,
          },
          {
            id: 'cr-q6',
            text: 'SQL Injection is best prevented by using:',
            points: 2.0,
            options: [
              'Input length restrictions only',
              'Parameterized queries / prepared statements',
              'Client-side validation only',
              'Hiding the database structure from users',
            ],
            correct: 1,
          },
          {
            id: 'cr-q7',
            text: 'What type of attack occurs when an attacker secretly intercepts and relays communication between two parties?',
            points: 2.0,
            options: ['DoS Attack', 'Man-in-the-Middle', 'Brute Force', 'Ransomware'],
            correct: 1,
          },
          {
            id: 'cr-q8',
            text: 'What does a WAF (Web Application Firewall) primarily protect against?',
            points: 2.0,
            options: [
              'Physical server intrusions',
              'Network layer DDoS attacks',
              'Common web exploits like XSS and SQLi',
              'Insider data theft threats',
            ],
            correct: 2,
          },
        ],
      },
      {
        label: 'Incident Response',
        questions: [
          {
            id: 'cr-q9',
            text: 'What is the first phase in the NIST incident response lifecycle?',
            points: 2.0,
            options: ['Containment', 'Detection & Analysis', 'Preparation', 'Recovery'],
            correct: 2,
          },
          {
            id: 'cr-q10',
            text: 'Which type of malware encrypts the victim\'s files and demands payment for the decryption key?',
            points: 2.0,
            options: ['Spyware', 'Adware', 'Ransomware', 'Rootkit'],
            correct: 2,
          },
        ],
      },
    ],
  },

  'data-skills': {
    testTitle: 'Data Skills Assessment',
    sections: [
      {
        label: 'SQL & Databases',
        questions: [
          {
            id: 'ds-q1',
            text: 'Which SQL clause is used to filter groups after a GROUP BY operation?',
            points: 2.0,
            options: ['WHERE', 'FILTER', 'HAVING', 'AND'],
            correct: 2,
          },
          {
            id: 'ds-q2',
            text: 'Which JOIN type returns all rows from both tables, filling NULL where there is no matching record?',
            points: 2.0,
            options: ['INNER JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'],
            correct: 2,
          },
          {
            id: 'ds-q3',
            text: 'In database normalization, which normal form eliminates partial functional dependencies?',
            points: 2.0,
            options: ['1NF', '2NF', '3NF', 'BCNF'],
            correct: 1,
          },
          {
            id: 'ds-q4',
            text: 'What does ACID stand for in the context of database transactions?',
            points: 2.0,
            options: [
              'Atomicity, Consistency, Isolation, Durability',
              'Access, Control, Integration, Data',
              'Aggregation, Consistency, Index, Delete',
              'Atomicity, Concurrency, Integrity, Distribution',
            ],
            correct: 0,
          },
        ],
      },
      {
        label: 'Analytics & Statistics',
        questions: [
          {
            id: 'ds-q5',
            text: 'Which statistical measure is LEAST affected by extreme outliers in a dataset?',
            points: 2.0,
            options: ['Mean', 'Mode', 'Median', 'Standard Deviation'],
            correct: 2,
          },
          {
            id: 'ds-q6',
            text: 'In machine learning, what does overfitting indicate about a trained model?',
            points: 2.0,
            options: [
              'It performs well on training data but poorly on unseen data',
              'It performs poorly on all data including training data',
              'It has too few parameters to learn patterns',
              'The training dataset is too small to be useful',
            ],
            correct: 0,
          },
          {
            id: 'ds-q7',
            text: 'Which chart type is best suited for showing the distribution of a continuous numerical variable?',
            points: 2.0,
            options: ['Bar chart', 'Pie chart', 'Histogram', 'Line chart'],
            correct: 2,
          },
          {
            id: 'ds-q8',
            text: 'A p-value of 0.03 with a significance level (α) of 0.05 means:',
            points: 2.0,
            options: [
              'Fail to reject the null hypothesis',
              'Reject the null hypothesis',
              'The test result is inconclusive',
              'The sample size is too small',
            ],
            correct: 1,
          },
        ],
      },
      {
        label: 'Big Data & ML',
        questions: [
          {
            id: 'ds-q9',
            text: 'Which of the following is a supervised learning algorithm?',
            points: 2.0,
            options: ['K-means Clustering', 'PCA (Principal Component Analysis)', 'Random Forest', 'DBSCAN'],
            correct: 2,
          },
          {
            id: 'ds-q10',
            text: 'What does ETL stand for in the context of data engineering pipelines?',
            points: 2.0,
            options: [
              'Execute, Transfer, Load',
              'Extract, Transform, Load',
              'Export, Test, Launch',
              'Encode, Transfer, Link',
            ],
            correct: 1,
          },
        ],
      },
    ],
  },
};
