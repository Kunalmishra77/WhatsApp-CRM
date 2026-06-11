/**
 * ================================================================
 *  UMANG HOSPITAL CRM — Google Sheets → Supabase Sync Script
 * ================================================================
 *
 *  SETUP (do this once):
 *  ─────────────────────
 *  1. Open your Google Sheet
 *  2. Go to  Extensions → Apps Script
 *  3. Delete any existing code, paste this entire file
 *  4. Click  Save  (💾)
 *  5. Run  setupTrigger()  — installs hourly auto-sync
 *  6. Run  resetAndResync()  — loads ALL historical rows right now
 *
 *  AFTER SETUP:
 *  ────────────
 *  • Data syncs automatically every hour
 *  • New rows from your sheet arrive in Supabase within 1 hour
 *  • All data will appear in your CRM (Conversations + Leads pages)
 *
 *  YOUR SHEET COLUMNS (row 1 must have these exact headers):
 *  ──────────────────────────────────────────────────────────
 *  Timestamp | Date | Time | Phone Number | User Name |
 *  User Message | Bot Response | Conversation Stage |
 *  Session ID | Flag | summery
 *
 *  NOTE: "summery" is intentionally spelled that way — matches the DB.
 * ================================================================
 */


// ════════════════════════════════════════════════════════════════
//  SUPABASE CONFIG  (do not change these)
// ════════════════════════════════════════════════════════════════
var SUPABASE_URL = 'https://weukuysaxrtmnyqyrjdy.supabase.co';
var SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWt1eXNheHJ0bW55cXlyamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwNTk0NiwiZXhwIjoyMDg2MzgxOTQ2fQ.d6YDIsc756IpAcEBia1rPZSVOo0x7HNpuWSz8gwA9vg';
var BATCH_SIZE   = 200; // rows per API call


// ════════════════════════════════════════════════════════════════
//  CONVERSATION STAGE → CRM LEAD STAGE MAPPING
// ════════════════════════════════════════════════════════════════
// Priority: higher number = more advanced in funnel
var STAGE_PRIORITY = {
  'Conversion Attempt' : 5,
  'Solution Provided'  : 4,
  'Appointment Booked' : 5,
  'Inquiry'            : 3,
  'Initial Contact'    : 1
};

// Maps sheet Conversation Stage → lead_insights "lead stage"
var STAGE_TO_LEAD = {
  'Conversion Attempt' : 'Hot',
  'Appointment Booked' : 'Hot',
  'Solution Provided'  : 'Warm',
  'Inquiry'            : 'Warm',
  'Initial Contact'    : 'Cold'
};

// Short messages to skip when extracting patient concern
var SKIP_MSGS = [
  'hi','hello','hey','ok','okay','yes','no','na','nahi','haan',
  'bye','thanks','thank you','ji','acha','theek hai','thik hai',
  'thik','hy','good morning','good evening','good afternoon',
  'namaste','namaskar',''
];


// ════════════════════════════════════════════════════════════════
//  MAIN FUNCTIONS  (run these from Apps Script editor)
// ════════════════════════════════════════════════════════════════

/**
 * ▶ FULL RE-SYNC
 * Clears DB, resets pointers, re-inserts ALL rows from sheet.
 * Run this after first setup or after manually clearing the DB.
 */
function resetAndResync() {
  Logger.log('🔄 Starting full reset and re-sync...');

  // Clear both tables
  supaDelete_('whatsapp_conversations', 'Timestamp=gte.2000-01-01T00:00:00.000Z');
  supaDelete_('lead_insights',          'Timestamp=gte.2000-01-01T00:00:00.000Z');

  // Reset row counters
  PropertiesService.getScriptProperties().deleteAllProperties();

  // Push everything
  fullSync_();

  Logger.log('🎉 Full re-sync complete.');
  try { SpreadsheetApp.getActiveSpreadsheet().toast('Full re-sync done ✅', 'Umang CRM', 6); } catch(e) {}
}


/**
 * ▶ INCREMENTAL SYNC (also called by hourly trigger)
 * Only pushes rows added since the last run. Safe to run anytime.
 */
function syncNew() {
  fullSync_();
}


/**
 * ▶ SETUP TRIGGER
 * Installs an hourly auto-sync. Run this ONCE after pasting the script.
 */
function setupTrigger() {
  // Remove old triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'syncNew') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncNew').timeBased().everyHours(1).create();
  Logger.log('✅ Hourly trigger installed: syncNew() will run every hour.');
  try { SpreadsheetApp.getActiveSpreadsheet().toast('Auto-sync every hour ✅', '⏰ Trigger Set', 5); } catch(e) {}
}


/**
 * ▶ REMOVE TRIGGER
 */
function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'syncNew') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Trigger removed.');
}


/**
 * ▶ CHECK STATUS
 * Shows sync progress in the Apps Script log.
 */
function checkStatus() {
  var props = PropertiesService.getScriptProperties();
  var sheet = findConvSheet_();
  Logger.log('═══ Umang CRM Sync Status ═══');
  Logger.log('Last synced conv row : ' + (props.getProperty('CONV_LAST') || 'Not started'));
  if (sheet) {
    Logger.log('Sheet total data rows: ' + (sheet.getLastRow() - 1));
    var pending = (sheet.getLastRow() - 1) - parseInt(props.getProperty('CONV_LAST') || '0', 10);
    Logger.log('Pending rows         : ' + Math.max(0, pending));
  }
}


// ════════════════════════════════════════════════════════════════
//  INTERNAL SYNC LOGIC
// ════════════════════════════════════════════════════════════════

function fullSync_() {
  var sheet = findConvSheet_();
  if (!sheet) {
    Logger.log('❌ Sheet not found. Make sure row 1 has the correct column headers.');
    try { SpreadsheetApp.getActiveSpreadsheet().toast('Sheet not found ❌', 'Error', 6); } catch(e) {}
    return;
  }

  var allData = sheet.getDataRange().getValues();
  if (allData.length < 2) {
    Logger.log('Sheet has no data rows.');
    return;
  }

  // Build header → index map
  var headerRow = allData[0];
  var H = {};
  headerRow.forEach(function(h, i) { H[String(h).trim()] = i; });

  var dataRows = allData.slice(1); // all data rows (no header)

  // Step 1 — sync raw conversations (incremental)
  var convInserted = syncConversations_(dataRows, H);

  // Step 2 — derive and upsert lead insights (one per phone)
  var leadStats = upsertLeadInsights_(dataRows, H);

  var msg = [
    'Conversations: +' + convInserted + ' new rows',
    'Leads created: +' + leadStats.inserted,
    'Leads updated:  ' + leadStats.updated
  ].join('\n');

  Logger.log('✅ Sync complete:\n' + msg);
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, '✅ Umang CRM Sync', 8); } catch(e) {}
}


// ── Step 1: Conversations ────────────────────────────────────────────────────

function syncConversations_(dataRows, H) {
  var props    = PropertiesService.getScriptProperties();
  var lastSent = parseInt(props.getProperty('CONV_LAST') || '0', 10);
  var newRows  = dataRows.slice(lastSent);

  if (newRows.length === 0) {
    Logger.log('Conversations: nothing new (last=' + lastSent + ')');
    return 0;
  }

  var phoneIdx  = H['Phone Number'];
  var totalSent = 0;

  for (var b = 0; b < newRows.length; b += BATCH_SIZE) {
    var batch = newRows.slice(b, b + BATCH_SIZE);

    var records = [];
    batch.forEach(function(row) {
      var phone = clean_(row[phoneIdx]);
      if (!phone) return; // skip blank rows

      records.push({
        'Timestamp'          : toTs_(row[H['Timestamp']]),
        'Date'               : clean_(row[H['Date']]),
        'Time'               : clean_(row[H['Time']]),
        'Phone Number'       : phone,
        'User Name'          : clean_(row[H['User Name']]),
        'User Message'       : clean_(row[H['User Message']]),
        'Bot Response'       : clean_(row[H['Bot Response']]),
        'Conversation Stage' : clean_(row[H['Conversation Stage']]),
        'Session ID'         : clean_(row[H['Session ID']]),
        'Flag'               : clean_(row[H['Flag']]),
        'summery'            : clean_(row[H['summery']])
      });
    });

    if (records.length > 0) {
      var ok = supaPost_('whatsapp_conversations', records);
      if (!ok) {
        Logger.log('⚠️ Conversation batch failed at row offset ' + (lastSent + b) + '. Stopping.');
        break;
      }
      totalSent += records.length;
    }

    // Advance pointer after each successful batch
    props.setProperty('CONV_LAST', String(lastSent + b + batch.length));
  }

  Logger.log('Conversations: inserted ' + totalSent + ' new rows');
  return totalSent;
}


// ── Step 2: Lead Insights ────────────────────────────────────────────────────

function upsertLeadInsights_(dataRows, H) {
  // Group all rows by Phone Number
  var phoneGroups = {}; // phone → [rows]

  dataRows.forEach(function(row) {
    var phone = clean_(row[H['Phone Number']]);
    if (!phone) return;
    if (!phoneGroups[phone]) phoneGroups[phone] = [];
    phoneGroups[phone].push(row);
  });

  var phones = Object.keys(phoneGroups);
  if (phones.length === 0) return { inserted: 0, updated: 0 };

  // Fetch phones that already have a lead_insights entry
  var existingPhones = fetchExistingInsightPhones_();

  var toInsert = [];
  var toUpdate = []; // { phone, patch }

  phones.forEach(function(phone) {
    var insight = buildInsight_(phone, phoneGroups[phone], H);
    if (existingPhones.indexOf(phone) === -1) {
      toInsert.push(insight);
    } else {
      // Update only the mutable fields (stage, summary, sentiment, action)
      toUpdate.push({
        phone: phone,
        patch: {
          'lead stage'          : insight['lead stage'],
          'Conversation Summary': insight['Conversation Summary'],
          'sentiment'           : insight['sentiment'],
          'Action to be taken'  : insight['Action to be taken'],
          'concern'             : insight['concern']
        }
      });
    }
  });

  // Batch insert new leads
  var inserted = 0;
  for (var b = 0; b < toInsert.length; b += 50) {
    var batch = toInsert.slice(b, b + 50);
    if (supaPost_('lead_insights', batch)) inserted += batch.length;
  }

  // Update existing leads (one PATCH per phone — they're few)
  var updated = 0;
  toUpdate.forEach(function(item) {
    var filter = 'Phone%20Number=eq.' + encodeURIComponent(item.phone);
    if (supaPatch_('lead_insights', filter, item.patch)) updated++;
  });

  Logger.log('Lead Insights: inserted ' + inserted + ', updated ' + updated);
  return { inserted: inserted, updated: updated };
}


/**
 * Derives a single lead_insights record from all conversations for a phone.
 */
function buildInsight_(phone, rows, H) {
  // Sort by Timestamp ascending so earliest comes first
  rows.sort(function(a, b) {
    return tsMs_(a[H['Timestamp']]) - tsMs_(b[H['Timestamp']]);
  });

  var firstName    = '';
  var firstTs      = null;
  var firstDate    = null;
  var firstTime    = null;
  var concern      = '';
  var bestStagePri = 0;
  var bestStage    = 'Initial Contact';
  var sessionSet   = {};
  var msgCount     = 0;
  var appointmentMentioned = false;
  var priceMentioned       = false;
  var emergencyMentioned   = false;
  var specialistMentioned  = '';

  rows.forEach(function(row) {
    var name    = clean_(row[H['User Name']]);
    var stage   = clean_(row[H['Conversation Stage']]) || 'Initial Contact';
    var msg     = (clean_(row[H['User Message']]) || '').toLowerCase();
    var botResp = (clean_(row[H['Bot Response']]) || '').toLowerCase();
    var sid     = clean_(row[H['Session ID']]);
    var ts      = row[H['Timestamp']];
    var dt      = clean_(row[H['Date']]);
    var tm      = clean_(row[H['Time']]);

    if (name && !firstName) firstName = name;
    if (!firstTs) { firstTs = ts; firstDate = dt; firstTime = tm; }
    if (sid) sessionSet[sid] = true;
    msgCount++;

    // Track best stage
    var pri = STAGE_PRIORITY[stage] || 0;
    if (pri > bestStagePri) { bestStagePri = pri; bestStage = stage; }

    // Extract first meaningful patient concern
    if (!concern && msg && msg.length >= 4 && !isTrivial_(msg)) {
      var cap = msg.charAt(0).toUpperCase() + msg.slice(1);
      concern = cap.length > 120 ? cap.slice(0, 120) + '...' : cap;
    }

    // Detect intent signals from the full conversation
    if (/appointment|book|opd|schedule|visit/i.test(msg + botResp))     appointmentMentioned = true;
    if (/price|cost|fee|charges|rate|insurance|cghs/i.test(msg + botResp)) priceMentioned = true;
    if (/emergency|urgent|immediate|severe|critical/i.test(msg + botResp)) emergencyMentioned = true;

    // Detect medical specialty
    var specMatch = (msg + ' ' + botResp).match(
      /cardiol\w*|orthoped\w*|neurol\w*|gynaecol\w*|pediatr\w*|urolog\w*|gastro\w*|pulmon\w*|general surgery|dermatol\w*|oncol\w*/i
    );
    if (specMatch && !specialistMentioned) specialistMentioned = specMatch[0];
  });

  // Derive lead stage
  var leadStage = STAGE_TO_LEAD[bestStage] || 'Cold';

  // Derive sentiment
  var sentiment = 'Neutral';
  if (bestStagePri >= 5) sentiment = 'Positive';
  else if (appointmentMentioned || priceMentioned) sentiment = 'Positive';
  else if (bestStagePri >= 3) sentiment = 'Positive';

  // Build a rich, descriptive summary that helps the scoring algorithm
  var summaryParts = [];
  summaryParts.push((firstName || 'Patient') + ' contacted Umang Hospital via WhatsApp.');
  if (concern) summaryParts.push('Concern: ' + concern + '.');
  if (specialistMentioned) summaryParts.push('Interested in: ' + specialistMentioned + ' department.');
  if (appointmentMentioned) summaryParts.push('Appointment/consultation requested.');
  if (priceMentioned)       summaryParts.push('Inquired about cost/pricing/insurance.');
  if (emergencyMentioned)   summaryParts.push('Emergency/urgency mentioned.');
  summaryParts.push(
    Object.keys(sessionSet).length + ' session(s), ' + msgCount + ' messages. ' +
    'Highest stage: ' + bestStage + '.'
  );

  var summary = summaryParts.join(' ');

  // Derive next action
  var action = leadStage === 'Hot'  ? 'Call back immediately and confirm appointment' :
               leadStage === 'Warm' ? 'Follow up within 24 hours' :
               'Monitor — send hospital info if re-engages';

  return {
    'Timestamp'           : toTs_(firstTs)  || new Date().toISOString(),
    'Date'                : firstDate  || '',
    'Time'                : firstTime  || '',
    'Phone Number'        : phone,
    'User Name'           : firstName  || 'Unknown',
    'concern'             : concern    || 'General hospital inquiry',
    'lead stage'          : leadStage,
    'Conversation Summary': summary,
    'sentiment'           : sentiment,
    'Action to be taken'  : action
  };
}


// ════════════════════════════════════════════════════════════════
//  SUPABASE REST HELPERS
// ════════════════════════════════════════════════════════════════

function supaHeaders_() {
  return {
    'apikey'        : SERVICE_KEY,
    'Authorization' : 'Bearer ' + SERVICE_KEY,
    'Content-Type'  : 'application/json',
    'Prefer'        : 'return=minimal'
  };
}

function supaPost_(table, records) {
  var resp = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/' + table,
    {
      method            : 'POST',
      headers           : supaHeaders_(),
      payload           : JSON.stringify(records),
      muteHttpExceptions: true
    }
  );
  var code = resp.getResponseCode();
  if (code === 200 || code === 201) return true;
  Logger.log('❌ POST /' + table + ' HTTP ' + code + ': ' + resp.getContentText().slice(0, 500));
  return false;
}

function supaPatch_(table, filterQuery, data) {
  var resp = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/' + table + '?' + filterQuery,
    {
      method            : 'PATCH',
      headers           : supaHeaders_(),
      payload           : JSON.stringify(data),
      muteHttpExceptions: true
    }
  );
  var code = resp.getResponseCode();
  if (code === 200 || code === 204) return true;
  Logger.log('❌ PATCH /' + table + ' HTTP ' + code + ': ' + resp.getContentText().slice(0, 300));
  return false;
}

function supaDelete_(table, filterQuery) {
  var resp = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/' + table + '?' + filterQuery,
    {
      method            : 'DELETE',
      headers           : supaHeaders_(),
      muteHttpExceptions: true
    }
  );
  Logger.log('DELETE /' + table + ' → HTTP ' + resp.getResponseCode());
}

function fetchExistingInsightPhones_() {
  var resp = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/lead_insights?select=Phone%20Number&limit=5000',
    {
      method            : 'GET',
      headers           : { 'apikey': SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY },
      muteHttpExceptions: true
    }
  );
  if (resp.getResponseCode() !== 200) return [];
  try {
    var rows = JSON.parse(resp.getContentText());
    return rows.map(function(r) { return r['Phone Number']; }).filter(Boolean);
  } catch(e) { return []; }
}


// ════════════════════════════════════════════════════════════════
//  UTILITY HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Auto-finds your conversation sheet by scanning for required column headers.
 * Works regardless of what your sheet tab is named.
 */
function findConvSheet_() {
  var required = ['Phone Number', 'User Message', 'Session ID', 'Conversation Stage', 'Timestamp'];
  var sheets   = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var s    = sheets[i];
    var last = s.getLastColumn();
    if (last < 1) continue;
    var hdrs = s.getRange(1, 1, 1, last).getValues()[0].map(function(h) {
      return String(h).trim();
    });
    var match = required.every(function(c) { return hdrs.indexOf(c) !== -1; });
    if (match) {
      Logger.log('Using sheet: "' + s.getName() + '"');
      return s;
    }
  }
  return null;
}

/** Convert cell value → ISO timestamp string (handles Date objects + strings) */
function toTs_(val) {
  if (!val || val === '') return null;
  if (val instanceof Date) return val.toISOString(); // ← correct UTC
  try {
    var d = new Date(String(val));
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch(e) {}
  return String(val);
}

/** Return timestamp as ms for sorting */
function tsMs_(val) {
  if (val instanceof Date) return val.getTime();
  if (!val) return 0;
  try { return new Date(String(val)).getTime() || 0; } catch(e) { return 0; }
}

/** Clean a cell value — returns null for empty/blank */
function clean_(val) {
  if (val === null || val === undefined || val === '') return null;
  var s = String(val).trim();
  return s === '' ? null : s;
}

/** Returns true if a patient message is too trivial to use as a concern */
function isTrivial_(msg) {
  if (!msg) return true;
  var lower = msg.toLowerCase().trim();
  if (lower.length < 4) return true;
  return SKIP_MSGS.indexOf(lower) !== -1;
}
