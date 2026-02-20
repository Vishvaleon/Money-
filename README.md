Graph-Based Financial Crime Detection Engine RIFT 2026 Hackathon – Graph Theory Track Money Muling Detection Challenge

Live Demo Live App: https://guardian-crime-watch.base44.app

🔗 GitHub: https://github.com/Vishvaleon/Money-

🎥 Demo Video: [https://linkedin.com/your-video-link](https://www.linkedin.com/posts/vishva17_im-thrilled-to-share-our-latest-project-activity-7430413687418527744-36e8?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAE0OnJsB0_22MxsMKh2iLtxY4Br-4rHwiZ8)

Why We Built This

Financial crimes today are no longer simple one-to-one frauds.

Money is layered, split, rerouted, and circulated across networks of accounts — making it extremely difficult to trace using traditional database queries.

This is where graph theory becomes powerful.

Our solution treats transactions not as rows in a table — but as relationships in a network.

Instead of asking:

“Did A send money to B?”

We ask:

“What hidden structures exist in this transaction network?”

** The Problem**

Money muling is a technique where criminals move illicit funds through multiple intermediary accounts to:

Obscure the source

Break transaction trails

Bypass compliance checks

Traditional systems struggle to detect:

Circular fund routing

Smurfing aggregation patterns

Layered shell transfers

Sudden behavioral spikes

We built a system specifically to detect these patterns using graph algorithms and temporal analysis.

What Our System Does

Upload transaction CSV data

Convert transactions into a directed graph

Run fraud detection algorithms

Generate:

Interactive graph visualization

Suspicious accounts table

Fraud ring detection summary

Downloadable JSON report (judge-ready format)

System Architecture Frontend

React

Cytoscape.js (Graph visualization)

CSV upload

Interactive UI ** Backend**

Node.js

Express.js

Graph Processing Engine

Temporal analysis module

Core Modules /frontend /backend /graph-engine /utils

Detection Strategies

We implemented four major detection engines.

Circular Fund Routing (Cycle Detection)
Fraud rings often rotate money in loops to obscure origins.

We detect:

Cycles of length 3–5

Ignore simple 2-node transfers

Merge overlapping cycles into unified fraud rings

Generate deterministic ring IDs (for reproducible outputs)

Algorithm used:

Depth-limited DFS

Optimized adjacency list traversal

This helps uncover coordinated circular laundering networks.

Smurfing Detection (72-Hour Window)
Smurfing breaks large transactions into many small ones.

We detect:

Fan-In Pattern

10+ unique senders

1 receiver

Within 72 hours

Fan-Out Pattern

1 sender

10+ receivers

Within 72 hours

False positives avoided by:

Ignoring accounts with >200 transactions

Excluding payroll-style batch transfers

Analyzing daily transaction variance

We use sliding time windows for efficient processing. 3. Layered Shell Network Detection

Criminals often pass money through “low-activity” accounts.

We detect:

Path length ≥ 3

BFS depth up to 4

Intermediate accounts must:

Have low degree

Have low transaction counts

This uncovers hidden mule layering chains.

High Velocity Spike Detection
Sudden bursts of activity often signal fraud.

We detect:

5+ transactions within 1 hour

Compare against historical baseline

This identifies behavioral anomalies in accounts.

Suspicion Score Model

Instead of binary classification, we compute a weighted suspicion score.

Pattern Weight Cycle Detection 35% Smurfing 30% Shell Network 20% Velocity Spike 15%

Scores normalized from 0–100

Rounded to 1 decimal

Sorted in descending order

Fraud Ring Risk Score = Average of member scores

This gives both account-level and network-level risk visibility. ** JSON Output**

The system generates a structured JSON report:

{ "suspicious_accounts": [...], "fraud_rings": [...], "summary": {...} }

Deterministic ordering

All required fields included

Ready for automated judge evaluation

** Performance**

Handles up to 10,000 transactions

Execution time < 30 seconds

No cubic brute-force loops

Efficient graph traversal

Built for scalability and clarity.

** CSV Input Format**

Required columns:

Column Type transaction_id String sender_id String receiver_id String amount Float timestamp YYYY-MM-DD HH:MM:SS

How We Avoid False Positives

Fraud detection is not just about catching fraud — it’s about avoiding false alarms.

We explicitly avoid flagging:

Payroll distribution accounts

High-volume merchants

Stable recurring batch accounts

We apply:

Degree analysis

Variance-based filtering

Transaction frequency normalization

This makes the system more realistic and practical.

** Future Improvements**

Betweenness centrality scoring

Louvain community detection

Real-time streaming detection

ML-based anomaly classification

Team Details

Vishva M

Sujitha V

Karishma sri K

Monika S

Hackathon Submission

Challenge: Money Muling Detection

Track: Graph Theory

Deployment: Vercel,Base44

Precision Target: ≥ 70%

Recall Target: ≥ 60%
