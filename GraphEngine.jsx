// Graph-Based Financial Crime Detection Engine
// Core algorithms for detecting money muling networks

export class GraphEngine {
  constructor() {
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.transactionHistory = new Map();
    this.accountDegree = new Map();
    this.timestampGroups = new Map();
    this.transactions = [];
  }

  // Parse and validate CSV data
  parseTransactions(csvData) {
    const lines = csvData.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredFields = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'];
    const fieldIndices = {};
    
    for (const field of requiredFields) {
      const idx = header.indexOf(field);
      if (idx === -1) {
        throw new Error(`Missing required field: ${field}`);
      }
      fieldIndices[field] = idx;
    }

    this.transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      
      const transaction = {
        transaction_id: values[fieldIndices.transaction_id]?.trim(),
        sender_id: values[fieldIndices.sender_id]?.trim(),
        receiver_id: values[fieldIndices.receiver_id]?.trim(),
        amount: parseFloat(values[fieldIndices.amount]),
        timestamp: new Date(values[fieldIndices.timestamp]?.trim())
      };

      if (!transaction.transaction_id || !transaction.sender_id || !transaction.receiver_id) {
        throw new Error(`Invalid data at line ${i + 1}: missing required fields`);
      }
      
      if (isNaN(transaction.amount)) {
        throw new Error(`Invalid amount at line ${i + 1}`);
      }
      
      if (isNaN(transaction.timestamp.getTime())) {
        throw new Error(`Invalid timestamp at line ${i + 1}`);
      }

      this.transactions.push(transaction);
    }

    return this.transactions;
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }

  // Build graph data structures
  buildGraph() {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.transactionHistory.clear();
    this.accountDegree.clear();
    this.timestampGroups.clear();

    for (const tx of this.transactions) {
      const { sender_id, receiver_id, timestamp, amount } = tx;

      // Adjacency list (outgoing edges)
      if (!this.adjacencyList.has(sender_id)) {
        this.adjacencyList.set(sender_id, new Set());
      }
      this.adjacencyList.get(sender_id).add(receiver_id);

      // Reverse adjacency list (incoming edges)
      if (!this.reverseAdjacencyList.has(receiver_id)) {
        this.reverseAdjacencyList.set(receiver_id, new Set());
      }
      this.reverseAdjacencyList.get(receiver_id).add(sender_id);

      // Transaction history
      const key = `${sender_id}->${receiver_id}`;
      if (!this.transactionHistory.has(key)) {
        this.transactionHistory.set(key, []);
      }
      this.transactionHistory.get(key).push({ timestamp, amount });

      // Account degree tracking
      this.accountDegree.set(sender_id, (this.accountDegree.get(sender_id) || 0) + 1);
      this.accountDegree.set(receiver_id, (this.accountDegree.get(receiver_id) || 0) + 1);

      // Timestamp grouping (hourly)
      const hourKey = new Date(timestamp).toISOString().slice(0, 13);
      if (!this.timestampGroups.has(hourKey)) {
        this.timestampGroups.set(hourKey, []);
      }
      this.timestampGroups.get(hourKey).push(tx);
    }
  }

  // Get all unique accounts
  getAllAccounts() {
    const accounts = new Set();
    for (const tx of this.transactions) {
      accounts.add(tx.sender_id);
      accounts.add(tx.receiver_id);
    }
    return Array.from(accounts);
  }

  // A) Cycle Detection using DFS
  detectCycles() {
    const cycles = [];
    const visited = new Set();
    const accounts = this.getAllAccounts();

    const dfs = (start, current, path, depth) => {
      if (depth > 5) return;
      
      const neighbors = this.adjacencyList.get(current) || new Set();
      
      for (const neighbor of neighbors) {
        if (neighbor === start && path.length >= 3 && path.length <= 5) {
          // Found a cycle
          const cycle = [...path];
          const normalized = this.normalizeCycle(cycle);
          const cycleKey = normalized.join(',');
          
          if (!visited.has(cycleKey)) {
            visited.add(cycleKey);
            cycles.push(cycle);
          }
        } else if (!path.includes(neighbor) && depth < 5) {
          dfs(start, neighbor, [...path, neighbor], depth + 1);
        }
      }
    };

    for (const account of accounts) {
      dfs(account, account, [account], 1);
    }

    return cycles;
  }

  normalizeCycle(cycle) {
    // Normalize cycle for deduplication
    const minIdx = cycle.indexOf(cycle.slice().sort()[0]);
    const rotated = [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
    return rotated;
  }

  // B) Smurfing Detection
  detectSmurfing() {
    const fanInAccounts = [];
    const fanOutAccounts = [];
    const windowMs = 72 * 60 * 60 * 1000; // 72 hours

    const accounts = this.getAllAccounts();
    
    // Calculate transaction counts for false positive protection
    const accountTxCounts = new Map();
    for (const tx of this.transactions) {
      accountTxCounts.set(tx.sender_id, (accountTxCounts.get(tx.sender_id) || 0) + 1);
      accountTxCounts.set(tx.receiver_id, (accountTxCounts.get(tx.receiver_id) || 0) + 1);
    }

    // Check daily variance for payroll detection
    const dailyPatterns = new Map();
    for (const tx of this.transactions) {
      const dayKey = tx.timestamp.toISOString().slice(0, 10);
      const accountKey = tx.sender_id;
      const key = `${accountKey}:${dayKey}`;
      dailyPatterns.set(key, (dailyPatterns.get(key) || 0) + 1);
    }

    const isLikelyPayroll = (accountId) => {
      const counts = [];
      const days = new Set();
      for (const [key, count] of dailyPatterns) {
        if (key.startsWith(accountId + ':')) {
          counts.push(count);
          days.add(key.split(':')[1]);
        }
      }
      if (counts.length < 5) return false;
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
      return variance < 2 && days.size > 10; // Very stable daily patterns
    };

    for (const account of accounts) {
      // Skip accounts with too many transactions (likely legitimate)
      if (accountTxCounts.get(account) > 200) continue;
      if (isLikelyPayroll(account)) continue;

      // Fan-in detection
      const incomingTxs = this.transactions.filter(tx => tx.receiver_id === account);
      const timeWindows = this.groupByTimeWindow(incomingTxs, windowMs);
      
      for (const windowTxs of timeWindows) {
        const uniqueSenders = new Set(windowTxs.map(tx => tx.sender_id));
        if (uniqueSenders.size >= 10) {
          fanInAccounts.push({
            account_id: account,
            sender_count: uniqueSenders.size,
            pattern: 'fan_in'
          });
          break;
        }
      }

      // Fan-out detection
      const outgoingTxs = this.transactions.filter(tx => tx.sender_id === account);
      const outTimeWindows = this.groupByTimeWindow(outgoingTxs, windowMs);
      
      for (const windowTxs of outTimeWindows) {
        const uniqueReceivers = new Set(windowTxs.map(tx => tx.receiver_id));
        if (uniqueReceivers.size >= 10) {
          fanOutAccounts.push({
            account_id: account,
            receiver_count: uniqueReceivers.size,
            pattern: 'fan_out'
          });
          break;
        }
      }
    }

    return { fanInAccounts, fanOutAccounts };
  }

  groupByTimeWindow(transactions, windowMs) {
    if (transactions.length === 0) return [];
    
    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    const windows = [];
    
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = sorted[i].timestamp.getTime();
      const windowEnd = windowStart + windowMs;
      const windowTxs = sorted.filter(tx => {
        const time = tx.timestamp.getTime();
        return time >= windowStart && time <= windowEnd;
      });
      windows.push(windowTxs);
    }
    
    return windows;
  }

  // C) Layered Shell Detection
  detectLayeredShells() {
    const shells = [];
    const accounts = this.getAllAccounts();
    const visited = new Set();

    const findChain = (start, path) => {
      const current = path[path.length - 1];
      const neighbors = this.adjacencyList.get(current) || new Set();

      for (const neighbor of neighbors) {
        if (path.includes(neighbor)) continue;
        
        const degree = this.accountDegree.get(neighbor) || 0;
        const txCount = this.getAccountTxCount(neighbor);

        // Check if intermediate node (not first or last in chain)
        if (path.length >= 2 && degree <= 3 && txCount <= 3) {
          const newPath = [...path, neighbor];
          
          if (newPath.length >= 3) {
            const chainKey = newPath.join('->');
            if (!visited.has(chainKey)) {
              visited.add(chainKey);
              shells.push(newPath);
            }
          }
          
          if (newPath.length < 6) {
            findChain(start, newPath);
          }
        }
      }
    };

    for (const account of accounts) {
      findChain(account, [account]);
    }

    return shells;
  }

  getAccountTxCount(accountId) {
    return this.transactions.filter(
      tx => tx.sender_id === accountId || tx.receiver_id === accountId
    ).length;
  }

  // D) High Velocity Detection
  detectHighVelocity() {
    const highVelocityAccounts = [];
    const accounts = this.getAllAccounts();
    const burstWindowMs = 60 * 60 * 1000; // 1 hour

    for (const account of accounts) {
      const accountTxs = this.transactions.filter(
        tx => tx.sender_id === account || tx.receiver_id === account
      ).sort((a, b) => a.timestamp - b.timestamp);

      if (accountTxs.length < 5) continue;

      // Check for bursts
      for (let i = 0; i < accountTxs.length - 4; i++) {
        const windowStart = accountTxs[i].timestamp.getTime();
        const windowEnd = windowStart + burstWindowMs;
        
        const burstTxs = accountTxs.filter(tx => {
          const time = tx.timestamp.getTime();
          return time >= windowStart && time <= windowEnd;
        });

        if (burstTxs.length >= 5) {
          highVelocityAccounts.push({
            account_id: account,
            burst_count: burstTxs.length,
            pattern: 'high_velocity'
          });
          break;
        }
      }
    }

    return highVelocityAccounts;
  }

  // Merge overlapping cycles into fraud rings
  buildFraudRings(cycles, smurfing, shells, velocity) {
    const rings = [];
    let ringCounter = 1;
    const accountToRing = new Map();

    // Process cycles
    for (const cycle of cycles) {
      const existingRings = new Set();
      for (const account of cycle) {
        if (accountToRing.has(account)) {
          existingRings.add(accountToRing.get(account));
        }
      }

      let ringId;
      if (existingRings.size === 0) {
        ringId = `RING_${String(ringCounter++).padStart(3, '0')}`;
        rings.push({
          ring_id: ringId,
          member_accounts: new Set(cycle),
          pattern_type: 'cycle',
          cycle_length: cycle.length
        });
      } else {
        // Merge into first existing ring
        ringId = Array.from(existingRings)[0];
        const ring = rings.find(r => r.ring_id === ringId);
        cycle.forEach(acc => ring.member_accounts.add(acc));
      }

      cycle.forEach(acc => accountToRing.set(acc, ringId));
    }

    // Process shells as separate rings
    for (const shell of shells) {
      if (shell.length >= 3) {
        const ringId = `RING_${String(ringCounter++).padStart(3, '0')}`;
        rings.push({
          ring_id: ringId,
          member_accounts: new Set(shell),
          pattern_type: 'layered_shell'
        });
        shell.forEach(acc => {
          if (!accountToRing.has(acc)) {
            accountToRing.set(acc, ringId);
          }
        });
      }
    }

    // Convert Sets to Arrays
    return rings.map(ring => ({
      ...ring,
      member_accounts: Array.from(ring.member_accounts)
    }));
  }

  // Calculate suspicion scores
  calculateSuspicionScores(cycles, smurfing, shells, velocity, rings) {
    const scores = new Map();
    const patterns = new Map();
    const accountToRing = new Map();

    // Map accounts to rings
    for (const ring of rings) {
      for (const account of ring.member_accounts) {
        accountToRing.set(account, ring.ring_id);
      }
    }

    const addScore = (accountId, score, pattern) => {
      scores.set(accountId, (scores.get(accountId) || 0) + score);
      if (!patterns.has(accountId)) {
        patterns.set(accountId, new Set());
      }
      patterns.get(accountId).add(pattern);
    };

    // Cycle scoring (35%)
    for (const cycle of cycles) {
      for (const account of cycle) {
        addScore(account, 35, `cycle_length_${cycle.length}`);
      }
    }

    // Smurfing scoring (30%)
    for (const fanIn of smurfing.fanInAccounts) {
      addScore(fanIn.account_id, 30, 'fan_in');
    }
    for (const fanOut of smurfing.fanOutAccounts) {
      addScore(fanOut.account_id, 30, 'fan_out');
    }

    // Shell scoring (20%)
    for (const shell of shells) {
      for (const account of shell) {
        addScore(account, 20, 'layered_shell');
      }
    }

    // Velocity scoring (15%)
    for (const v of velocity) {
      addScore(v.account_id, 15, 'high_velocity');
    }

    // Normalize scores and build result
    const maxScore = Math.max(...Array.from(scores.values()), 1);
    const suspiciousAccounts = [];

    for (const [accountId, rawScore] of scores) {
      const normalizedScore = Math.round((rawScore / maxScore) * 1000) / 10;
      if (normalizedScore > 0) {
        suspiciousAccounts.push({
          account_id: accountId,
          suspicion_score: Math.min(normalizedScore, 100),
          detected_patterns: Array.from(patterns.get(accountId) || []),
          ring_id: accountToRing.get(accountId) || null
        });
      }
    }

    // Sort by suspicion score descending
    suspiciousAccounts.sort((a, b) => b.suspicion_score - a.suspicion_score);

    return suspiciousAccounts;
  }

  // Calculate ring risk scores
  calculateRingRiskScores(rings, suspiciousAccounts) {
    return rings.map(ring => {
      const memberScores = suspiciousAccounts
        .filter(acc => ring.member_accounts.includes(acc.account_id))
        .map(acc => acc.suspicion_score);
      
      const avgScore = memberScores.length > 0
        ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
        : 0;
      
      return {
        ...ring,
        risk_score: Math.round(avgScore * 10) / 10
      };
    }).sort((a, b) => b.risk_score - a.risk_score);
  }

  // Main analysis function
  analyze(csvData) {
    const startTime = performance.now();

    // Parse transactions
    this.parseTransactions(csvData);
    
    // Build graph
    this.buildGraph();

    // Run detection algorithms
    const cycles = this.detectCycles();
    const smurfing = this.detectSmurfing();
    const shells = this.detectLayeredShells();
    const velocity = this.detectHighVelocity();

    // Build fraud rings
    const rings = this.buildFraudRings(cycles, smurfing, shells, velocity);

    // Calculate scores
    const suspiciousAccounts = this.calculateSuspicionScores(
      cycles, smurfing, shells, velocity, rings
    );

    // Calculate ring risk scores
    const fraudRings = this.calculateRingRiskScores(rings, suspiciousAccounts);

    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) / 10) / 100;

    // Build result
    const result = {
      suspicious_accounts: suspiciousAccounts,
      fraud_rings: fraudRings,
      summary: {
        total_accounts_analyzed: this.getAllAccounts().length,
        suspicious_accounts_flagged: suspiciousAccounts.length,
        fraud_rings_detected: fraudRings.length,
        processing_time_seconds: processingTime
      }
    };

    return {
      result,
      graphData: this.buildGraphData(suspiciousAccounts, fraudRings)
    };
  }

  // Build data for visualization
  buildGraphData(suspiciousAccounts, fraudRings) {
    const nodes = [];
    const edges = [];
    const suspiciousMap = new Map(suspiciousAccounts.map(a => [a.account_id, a]));
    const ringColorMap = new Map();
    
    const ringColors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
      '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#06B6D4'
    ];
    
    fraudRings.forEach((ring, idx) => {
      ringColorMap.set(ring.ring_id, ringColors[idx % ringColors.length]);
    });

    const accounts = this.getAllAccounts();
    
    for (const account of accounts) {
      const suspicious = suspiciousMap.get(account);
      const ringId = suspicious?.ring_id;
      
      nodes.push({
        id: account,
        suspicious: !!suspicious,
        suspicion_score: suspicious?.suspicion_score || 0,
        detected_patterns: suspicious?.detected_patterns || [],
        ring_id: ringId,
        color: ringId ? ringColorMap.get(ringId) : '#64748B',
        size: suspicious ? Math.max(20, suspicious.suspicion_score / 2) : 10
      });
    }

    // Build edges
    for (const [sender, receivers] of this.adjacencyList) {
      for (const receiver of receivers) {
        const txs = this.transactionHistory.get(`${sender}->${receiver}`) || [];
        edges.push({
          source: sender,
          target: receiver,
          transaction_count: txs.length,
          total_amount: txs.reduce((sum, tx) => sum + tx.amount, 0)
        });
      }
    }

    return { nodes, edges, fraudRings };
  }
}

export default GraphEngine;