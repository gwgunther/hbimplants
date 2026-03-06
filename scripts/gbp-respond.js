#!/usr/bin/env node
/**
 * scripts/gbp-respond.js
 * Reply to a Google Business Profile review
 *
 * Setup: Same OAuth credentials as gbp-reviews.js
 * Get the review ID from gbp-reviews.js output.
 *
 * Usage:
 *   node scripts/gbp-respond.js --review-id <reviewId> --reply "Your reply text"
 */

import 'dotenv/config';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { reviewId: null, reply: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--review-id' && args[i + 1]) opts.reviewId = args[i + 1];
    if (args[i] === '--reply' && args[i + 1]) opts.reply = args[i + 1];
  }
  return opts;
}

async function getAccessToken() {
  const { GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN } = process.env;
  if (!GBP_CLIENT_ID || !GBP_CLIENT_SECRET || !GBP_REFRESH_TOKEN) {
    console.error('Error: GBP_CLIENT_ID, GBP_CLIENT_SECRET, and GBP_REFRESH_TOKEN must be set in .env');
    process.exit(1);
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GBP_CLIENT_ID,
      client_secret: GBP_CLIENT_SECRET,
      refresh_token: GBP_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

async function replyToReview(accessToken, reviewId, replyText) {
  const { GBP_ACCOUNT_ID, GBP_LOCATION_ID } = process.env;
  if (!GBP_ACCOUNT_ID || !GBP_LOCATION_ID) {
    console.error('Error: GBP_ACCOUNT_ID and GBP_LOCATION_ID must be set in .env');
    process.exit(1);
  }

  const url = `https://mybusiness.googleapis.com/v4/accounts/${GBP_ACCOUNT_ID}/locations/${GBP_LOCATION_ID}/reviews/${reviewId}/reply`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: replyText }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GBP API error ${res.status}: ${err}`);
  }

  return res.status === 204 ? { success: true } : res.json();
}

async function main() {
  const opts = parseArgs();

  if (!opts.reviewId || !opts.reply) {
    console.error('Usage: node scripts/gbp-respond.js --review-id <reviewId> --reply "Your reply text"');
    console.error('Get review IDs from: node scripts/gbp-reviews.js --unanswered');
    process.exit(1);
  }

  if (opts.reply.length > 4096) {
    console.error(`Reply is too long (${opts.reply.length} chars). Maximum is 4096 characters.`);
    process.exit(1);
  }

  console.log(`\nReplying to review: ${opts.reviewId}`);
  console.log(`Reply (${opts.reply.length} chars): ${opts.reply.substring(0, 100)}${opts.reply.length > 100 ? '...' : ''}`);

  const accessToken = await getAccessToken();
  await replyToReview(accessToken, opts.reviewId, opts.reply);

  console.log('\nReply posted successfully!');
}

main().catch(err => {
  console.error('GBP reply failed:', err.message);
  process.exit(1);
});
