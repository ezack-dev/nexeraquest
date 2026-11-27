import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { createApp } from './app.js';
import { prisma } from './prisma.js';
import { LedgerService } from './services/ledgerService.js';

process.env.NODE_ENV = 'test';

async function apiCall(baseUrl: string, path: string, method = 'GET', body?: any) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function buildTelegramInitData(botToken: string, userObj: any): string {
  const params = new URLSearchParams();
  params.set('auth_date', Math.floor(Date.now() / 1000).toString());
  params.set('query_id', 'AAHdF6IQAAAAAN0XohDhrOrc');
  params.set('user', JSON.stringify(userObj));

  const arr: string[] = [];
  params.sort();
  params.forEach((v, k) => arr.push(`${k}=${v}`));
  const dataCheckString = arr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

async function resetDb() {
  await prisma.auditEvent.deleteMany();
  await prisma.fraudCase.deleteMany();
  await prisma.trustEvent.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.proof.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.balanceAccount.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function runTestPlan() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  console.log(`\n🧪 Starting Full Master Test Plan Verification on ${baseUrl}\n`);

  try {
    await resetDb();

    // =========================================================================
    // TEST SUITE 1: AUTHENTICATION & TELEGRAM HMAC VALIDATION
    // =========================================================================
    const prevToken = process.env.TELEGRAM_BOT_TOKEN;
    const testBotToken = '7777777777:AAFakeLiveTokenForHmacVerificationTest';
    process.env.TELEGRAM_BOT_TOKEN = testBotToken;

    const validInitData = buildTelegramInitData(testBotToken, {
      id: 444555666,
      username: 'hmac_user',
      first_name: 'Hmac',
      last_name: 'Verified',
      photo_url: 'https://t.me/i/userpic/320/hmac_user.jpg',
    });

    const authOk = await apiCall(baseUrl, '/api/auth/telegram', 'POST', { initData: validInitData });
    assert.equal(authOk.status, 200);
    assert.equal(authOk.data.user.username, 'hmac_user');
    assert.equal(authOk.data.user.photoUrl, 'https://t.me/i/userpic/320/hmac_user.jpg');
    assert.equal(authOk.data.user.trustScore, 50);

    // Re-login with updated Telegram display name & avatar URL (same username)
    const updatedInitData = buildTelegramInitData(testBotToken, {
      id: 444555666,
      username: 'hmac_user',
      first_name: 'HmacUpdated',
      last_name: '',
      photo_url: 'https://t.me/i/userpic/320/hmac_user_v2.jpg',
    });
    const authUpdated = await apiCall(baseUrl, '/api/auth/telegram', 'POST', { initData: updatedInitData });
    assert.equal(authUpdated.status, 200);
    assert.equal(authUpdated.data.user.firstName, 'HmacUpdated');
    assert.equal(authUpdated.data.user.lastName, '');
    assert.equal(authUpdated.data.user.photoUrl, 'https://t.me/i/userpic/320/hmac_user_v2.jpg');

    // Reject unsafe non-HTTPS photo_url scheme cleanly
    const unsafePhotoInitData = buildTelegramInitData(testBotToken, {
      id: 444555666,
      username: 'hmac_user',
      first_name: 'HmacUpdated',
      last_name: '',
      photo_url: 'http://insecure.example/avatar.png',
    });
    const authUnsafePhoto = await apiCall(baseUrl, '/api/auth/telegram', 'POST', { initData: unsafePhotoInitData });
    assert.equal(authUnsafePhoto.status, 200);
    assert.equal(authUnsafePhoto.data.user.photoUrl, null);

    const tamperedInitData = validInitData.replace('hmac_user', 'hacker_user');
    const authFail = await apiCall(baseUrl, '/api/auth/telegram', 'POST', { initData: tamperedInitData });
    assert.equal(authFail.status, 401);
    console.log('✅ AUTH-01: Telegram initData HMAC-SHA256, photo_url sync, and tampered signature (401) verified.');

    // AUTH-03: Browser Telegram Login Widget HMAC + Session Token Restore + /api/auth/config
    const widgetPayload: Record<string, any> = {
      id: 777888999,
      first_name: 'Widget',
      last_name: 'User',
      photo_url: 'https://t.me/i/userpic/320/widget_tg.jpg',
      username: 'widget_tg',
      auth_date: Math.floor(Date.now() / 1000),
    };
    const wCheckStr = ['auth_date', 'first_name', 'id', 'last_name', 'photo_url', 'username']
      .map((k) => `${k}=${widgetPayload[k]}`)
      .join('\n');
    const wSecret = crypto.createHash('sha256').update(testBotToken).digest();
    widgetPayload.hash = crypto.createHmac('sha256', wSecret).update(wCheckStr).digest('hex');

    const widgetOk = await apiCall(baseUrl, '/api/auth/telegram-widget', 'POST', { widgetData: widgetPayload });
    assert.equal(widgetOk.status, 200);
    assert.equal(widgetOk.data.user.username, 'widget_tg');
    assert.equal(widgetOk.data.user.photoUrl, 'https://t.me/i/userpic/320/widget_tg.jpg');
    assert.equal(widgetOk.data.authMode, 'telegram_widget');
    assert.ok(widgetOk.data.sessionToken);

    const widgetTampered = await apiCall(baseUrl, '/api/auth/telegram-widget', 'POST', {
      widgetData: { ...widgetPayload, username: 'spoofed' },
    });
    assert.equal(widgetTampered.status, 401);

    const sessRestore = await apiCall(baseUrl, '/api/auth/session', 'POST', {
      sessionToken: widgetOk.data.sessionToken,
    });
    assert.equal(sessRestore.status, 200);
    assert.equal(sessRestore.data.user.username, 'widget_tg');
    assert.equal(sessRestore.data.user.photoUrl, 'https://t.me/i/userpic/320/widget_tg.jpg');

    const profileCheck = await apiCall(baseUrl, `/api/user/profile/${widgetOk.data.user.id}`);
    assert.equal(profileCheck.status, 200);
    assert.equal(profileCheck.data.user.photoUrl, 'https://t.me/i/userpic/320/widget_tg.jpg');

    const sessBad = await apiCall(baseUrl, '/api/auth/session', 'POST', { sessionToken: 'bad.token' });
    assert.equal(sessBad.status, 401);

    const cfgRes = await apiCall(baseUrl, '/api/auth/config');
    assert.equal(cfgRes.status, 200);
    assert.equal(cfgRes.data.telegramAuthConfigured, true);
    assert.equal(cfgRes.data.demoModeEnabled, true);
    console.log('✅ AUTH-03: Browser Telegram Login Widget HMAC, session persistence, and /api/auth/config verified.');

    process.env.TELEGRAM_BOT_TOKEN = prevToken || 'mock_bot_token_nexeraquest';

    const userARes = await apiCall(baseUrl, '/api/auth/telegram', 'POST', {
      mockUser: { telegramId: '10001', username: 'user_alpha', firstName: 'Alpha' },
    });
    const userBRes = await apiCall(baseUrl, '/api/auth/telegram', 'POST', {
      mockUser: { telegramId: '10002', username: 'user_beta', firstName: 'Beta' },
      referralCode: userARes.data.user.referralCode,
    });
    const userA = userARes.data.user;
    const userB = userBRes.data.user;
    assert.equal(userB.trustScore, 50);
    console.log('✅ AUTH-02: Mock browser onboarding + referral attribution verified.');

    // =========================================================================
    // TEST SUITE 2: CAMPAIGN LIFECYCLE & ESCROW FUNDING (FIN-01, ADM-01)
    // =========================================================================
    const project = await prisma.project.create({
      data: { name: 'VerifyChain Labs', status: 'APPROVED' },
    });

    const createCampRes = await apiCall(baseUrl, '/api/campaigns', 'POST', {
      projectId: project.id,
      title: 'Join VerifyChain Telegram',
      description: 'Community growth campaign',
      category: 'COMMUNITY',
      taskType: 'TELEGRAM_JOIN',
      instructions: 'Join group and verify',
      externalUrl: 'https://t.me/verifychain',
      rewardPerAction: 0.50,
      targetSlots: 100,
      proofType: 'AUTOMATIC_MEMBERSHIP',
    });
    assert.equal(createCampRes.status, 201);
    const camp1 = createCampRes.data;
    assert.equal(camp1.rewardPool, 50.0);
    assert.equal(camp1.platformFee, 10.0);
    assert.equal(camp1.totalCost, 60.0);
    assert.equal(camp1.status, 'PENDING_REVIEW');

    // Audit before funding: unfunded PENDING_REVIEW campaign must NOT break solvency!
    let auditRes = await apiCall(baseUrl, '/api/admin/ledger/audit');
    assert.equal(auditRes.data.isBalanced, true);

    // Fund escrow (FIN-01)
    const fundRes = await apiCall(baseUrl, `/api/campaigns/${camp1.id}/fund`, 'POST', {
      depositRef: 'ESCROW_TX_001',
    });
    assert.equal(fundRes.status, 200);
    assert.equal(fundRes.data.campaign.status, 'ACTIVE');

    auditRes = await apiCall(baseUrl, '/api/admin/ledger/audit');
    assert.equal(auditRes.data.totalDeposits, 50.0);
    assert.equal(auditRes.data.totalPlatformFees, 10.0);
    assert.equal(auditRes.data.totalCampaignEscrowLiability, 50.0);
    assert.equal(auditRes.data.isBalanced, true);
    console.log('✅ FIN-01: Escrow pre-funding (Reward=$50, 20% Fee=$10, Total=$60) & audit verified.');

    // =========================================================================
    // TEST SUITE 3: AUTOMATIC VERIFICATION, IDEMPOTENCY & TRUST (FIN-02, FIN-03, FRD-03)
    // =========================================================================
    const start1 = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: camp1.id,
      userId: userA.id,
    });
    assert.equal(start1.status, 201);
    const task1Id = start1.data.taskInstance.id;

    const verify1 = await apiCall(baseUrl, `/api/tasks/${task1Id}/verify`, 'POST', {});
    assert.equal(verify1.status, 200);
    assert.equal(verify1.data.success, true);

    // Duplicate API verify attempt -> rejected (FIN-02)
    const verifyDup = await apiCall(baseUrl, `/api/tasks/${task1Id}/verify`, 'POST', {});
    assert.equal(verifyDup.status, 400);

    // Duplicate ledger credit call -> blocked (FIN-02)
    await assert.rejects(
      () => LedgerService.recordRewardCredit(userA.id, camp1.id, task1Id, 0.50),
      /already been credited/
    );

    const balA1 = await apiCall(baseUrl, `/api/user/balance/${userA.id}`);
    const profA1 = await apiCall(baseUrl, `/api/user/profile/${userA.id}`);
    assert.equal(balA1.data.available, 0.50);
    assert.equal(profA1.data.user.trustScore, 52); // +2 (FRD-03)
    console.log('✅ FIN-02 / FIN-03 / FRD-03: Zero-latency credit ($0.50), idempotency block, and +2 Trust Score verified.');

    // =========================================================================
    // TEST SUITE 4: MANUAL PROOF QUEUE, APPROVAL, REJECTION & DUPLICATE INTERCEPTION (FRD-02, FRD-04, ADM-02)
    // =========================================================================
    const linkCampRes = await apiCall(baseUrl, '/api/campaigns', 'POST', {
      projectId: project.id,
      title: 'Retweet & Share Link',
      description: 'Social boost',
      category: 'SOCIAL',
      taskType: 'TWITTER_FOLLOW',
      instructions: 'Submit tweet link',
      rewardPerAction: 2.00,
      targetSlots: 10,
      proofType: 'LINK_SUBMISSION',
    });
    await apiCall(baseUrl, `/api/campaigns/${linkCampRes.data.id}/fund`, 'POST');
    const linkCamp = linkCampRes.data;

    // User A submits valid X link -> auto-verified
    const startA_link = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: linkCamp.id,
      userId: userA.id,
    });
    const uniqueUrl = 'https://x.com/user_alpha/status/99999999999';
    const verifyA_link = await apiCall(baseUrl, `/api/tasks/${startA_link.data.taskInstance.id}/verify`, 'POST', {
      payload: uniqueUrl,
    });
    assert.equal(verifyA_link.status, 200);
    assert.equal(verifyA_link.data.status, 'VERIFIED');

    // User B tries to copy-paste User A's identical URL -> FRD-02 Duplicate Proof Interception!
    const startB_link = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: linkCamp.id,
      userId: userB.id,
    });
    const verifyB_dup = await apiCall(baseUrl, `/api/tasks/${startB_link.data.taskInstance.id}/verify`, 'POST', {
      payload: uniqueUrl,
    });
    assert.equal(verifyB_dup.status, 500);
    assert.match(verifyB_dup.data.error, /Plagiarism\/Sybil attempt flagged/);

    const profB_afterDup = await apiCall(baseUrl, `/api/user/profile/${userB.id}`);
    assert.equal(profB_afterDup.data.user.trustScore, 30); // 50 - 20 = 30
    console.log('✅ FRD-02: Duplicate proof hash intercepted and -20 Trust Score applied (50 -> 30).');

    // Create a manual TEXT_RESPONSE campaign for Admin review queue (FRD-04 & ADM-02)
    const fbCampRes = await apiCall(baseUrl, '/api/campaigns', 'POST', {
      projectId: project.id,
      title: 'Testnet Swap Feedback',
      description: 'Submit feedback',
      category: 'TESTING',
      taskType: 'FEEDBACK',
      instructions: 'Write feedback',
      rewardPerAction: 3.00,
      targetSlots: 5,
      proofType: 'TEXT_RESPONSE',
    });
    await apiCall(baseUrl, `/api/campaigns/${fbCampRes.data.id}/fund`, 'POST');
    const fbCamp = fbCampRes.data;

    // User B submits low-quality text -> Admin rejects -> -10 Trust Score -> Trust = 20 -> FROZEN! (FRD-04 + FRD-05)
    const startB_fb = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: fbCamp.id,
      userId: userB.id,
    });
    const subB_fb = await apiCall(baseUrl, `/api/tasks/${startB_fb.data.taskInstance.id}/verify`, 'POST', {
      payload: 'good app ok',
    });
    assert.equal(subB_fb.data.status, 'PENDING');

    const pendingProofs1 = await apiCall(baseUrl, '/api/admin/proofs/pending');
    assert.equal(pendingProofs1.data.length, 1);

    const rejectProofRes = await apiCall(
      baseUrl,
      `/api/admin/proofs/${pendingProofs1.data[0].id}/decision`,
      'POST',
      { decision: 'REJECT', reason: 'Low effort feedback' }
    );
    assert.equal(rejectProofRes.status, 200);

    const profB_frozen = await apiCall(baseUrl, `/api/user/profile/${userB.id}`);
    assert.equal(profB_frozen.data.user.trustScore, 20); // 30 - 10 = 20
    assert.equal(profB_frozen.data.user.status, 'FROZEN'); // Auto-freeze at <= 20!

    // Verify frozen account cannot start new tasks (403)
    const startB_blocked = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: camp1.id,
      userId: userB.id,
    });
    assert.equal(startB_blocked.status, 403);

    // FraudCase was created and can be cleared by Admin (ADM-04)
    const fraudList = await apiCall(baseUrl, '/api/admin/fraud/cases');
    assert.ok(fraudList.data.length >= 1);
    const openFraud = fraudList.data.find((f: any) => f.subjectId === userB.id && f.status === 'OPEN');
    assert.ok(openFraud, 'Expected OPEN fraud case for frozen user B');

    const resolveFraud = await apiCall(baseUrl, `/api/admin/fraud/cases/${openFraud.id}/resolve`, 'POST', {
      action: 'CLEARED',
      notes: 'Cleared after manual review',
    });
    assert.equal(resolveFraud.status, 200);
    const profB_cleared = await apiCall(baseUrl, `/api/user/profile/${userB.id}`);
    assert.equal(profB_cleared.data.user.status, 'ACTIVE');
    console.log('✅ FRD-04 / FRD-05 / ADM-04: Manual proof rejection (-10), auto-freeze at <=20 (403 block), and admin fraud clearance verified.');

    // User A submits manual feedback -> Admin approves -> +$3.00 credited!
    const startA_fb = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: fbCamp.id,
      userId: userA.id,
    });
    await apiCall(baseUrl, `/api/tasks/${startA_fb.data.taskInstance.id}/verify`, 'POST', {
      payload: 'Detailed UX review: Swap slippage calculation and TON Connect modal work reliably.',
    });
    const pendingProofs2 = await apiCall(baseUrl, '/api/admin/proofs/pending');
    assert.equal(pendingProofs2.data.length, 1);
    const approveProofRes = await apiCall(
      baseUrl,
      `/api/admin/proofs/${pendingProofs2.data[0].id}/decision`,
      'POST',
      { decision: 'APPROVE' }
    );
    assert.equal(approveProofRes.status, 200);
    // Double-decision guard check
    const approveAgain = await apiCall(
      baseUrl,
      `/api/admin/proofs/${pendingProofs2.data[0].id}/decision`,
      'POST',
      { decision: 'APPROVE' }
    );
    assert.equal(approveAgain.status, 400);
    console.log('✅ ADM-02: Manual proof approval settles reward and prevents duplicate decision.');

    // =========================================================================
    // TEST SUITE 5: WITHDRAWAL FLOW & REJECTION ROLLBACK (FIN-04, FIN-05, FIN-06)
    // =========================================================================
    // User A total available so far: $0.50 + $2.00 + $3.00 = $5.50
    const balA_beforeWd = await apiCall(baseUrl, `/api/user/balance/${userA.id}`);
    assert.equal(balA_beforeWd.data.available, 5.5);

    // Invalid TON and Arbitrum address validation -> rejected with 400
    const badTon = await apiCall(baseUrl, '/api/user/withdraw', 'POST', {
      userId: userA.id,
      amount: 1.0,
      destinationAddress: 'abc',
      network: 'TON',
    });
    assert.equal(badTon.status, 400);

    const badArb = await apiCall(baseUrl, '/api/user/withdraw', 'POST', {
      userId: userA.id,
      amount: 1.0,
      destinationAddress: 'not_an_evm_address',
      network: 'ARBITRUM',
    });
    assert.equal(badArb.status, 400);

    // Request Withdrawal #1 ($2.00) -> later REJECTED to verify rollback (FIN-06)
    const wd1Res = await apiCall(baseUrl, '/api/user/withdraw', 'POST', {
      userId: userA.id,
      amount: 2.0,
      destinationAddress: 'UQBvW8Z5huBkMJYdn3PCDnHoKKUWaFVOTzn0_rum0LN3ERA2',
      network: 'TON',
    });
    assert.equal(wd1Res.status, 201);
    const wd1Id = wd1Res.data.withdrawal.id;

    // Request Withdrawal #2 ($1.50) -> later AUTHORIZED to verify settlement (FIN-05)
    const wd2Res = await apiCall(baseUrl, '/api/user/withdraw', 'POST', {
      userId: userA.id,
      amount: 1.5,
      destinationAddress: 'EQBvW8Z5huBkMJYdn3PCDnHoKKUWaFVOTzn0_rum0LN3ERA2',
      network: 'TON',
    });
    assert.equal(wd2Res.status, 201);
    const wd2Id = wd2Res.data.withdrawal.id;

    let balA_midWd = await apiCall(baseUrl, `/api/user/balance/${userA.id}`);
    assert.equal(balA_midWd.data.available, 2.0); // 5.50 - 2.00 - 1.50
    assert.equal(balA_midWd.data.pending, 3.5);

    // Reject Withdrawal #1 -> Pending goes back to Available (FIN-06)
    const wd1Reject = await apiCall(baseUrl, `/api/admin/withdrawals/${wd1Id}/reject`, 'POST', {
      reason: 'Invalid TON destination format',
    });
    assert.equal(wd1Reject.status, 200);

    // Authorize Withdrawal #2 -> Pending moves to Withdrawn (FIN-05)
    const wd2Auth = await apiCall(baseUrl, `/api/admin/withdrawals/${wd2Id}/authorize`, 'POST', {
      txHash: '0xTestOnChainSettledTxHash123',
    });
    assert.equal(wd2Auth.status, 200);

    const balA_afterWd = await apiCall(baseUrl, `/api/user/balance/${userA.id}`);
    assert.equal(balA_afterWd.data.available, 4.0); // 2.0 + 2.0 restored!
    assert.equal(balA_afterWd.data.pending, 0.0);
    assert.equal(balA_afterWd.data.withdrawn, 1.5);
    console.log('✅ FIN-04 / FIN-05 / FIN-06: Withdrawal hold, rejection rollback (+$2.00 restored), and on-chain authorization ($1.50 settled) verified.');

    // =========================================================================
    // TEST SUITE 6: VELOCITY LIMIT & CYCLIC REFERRALS (FRD-01, FRD-06)
    // =========================================================================
    // FRD-06: Self referral and Cyclic referral (A -> B -> A)
    const selfRef = await apiCall(baseUrl, '/api/auth/referral/bind', 'POST', {
      userId: userA.id,
      referralCode: userA.referralCode,
    });
    assert.equal(selfRef.status, 400);

    // User A tries to bind User B's referral code (since B was already referred by A -> cycle A -> B -> A!)
    const cyclicRef = await apiCall(baseUrl, '/api/auth/referral/bind', 'POST', {
      userId: userA.id,
      referralCode: userB.referralCode,
    });
    assert.equal(cyclicRef.status, 400);
    assert.match(cyclicRef.data.error, /Cyclic or self-referral/);
    console.log('✅ FRD-06: Self-referral & cyclic referral loop (A -> B -> A) blocked.');

    // FRD-01: Velocity rate limit (>8 starts in 10 minutes returns 429)
    const velUserRes = await apiCall(baseUrl, '/api/auth/telegram', 'POST', {
      mockUser: { telegramId: '999888777', username: 'velocity_bot', firstName: 'Bot' },
    });
    const velUserId = velUserRes.data.user.id;

    // Create 9 tiny funded campaigns for velocity test
    const velCampIds: string[] = [];
    for (let i = 0; i < 9; i++) {
      const cRes = await apiCall(baseUrl, '/api/campaigns', 'POST', {
        projectId: project.id,
        title: `Velocity Quest ${i + 1}`,
        description: 'Speed test',
        category: 'COMMUNITY',
        taskType: 'TELEGRAM_JOIN',
        instructions: 'Join',
        rewardPerAction: 0.10,
        targetSlots: 10,
        proofType: 'AUTOMATIC_MEMBERSHIP',
      });
      await apiCall(baseUrl, `/api/campaigns/${cRes.data.id}/fund`, 'POST');
      velCampIds.push(cRes.data.id);
    }

    for (let i = 0; i < 8; i++) {
      const s = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
        campaignId: velCampIds[i],
        userId: velUserId,
      });
      assert.equal(s.status, 201);
    }
    const ninthAttempt = await apiCall(baseUrl, '/api/tasks/start', 'POST', {
      campaignId: velCampIds[8],
      userId: velUserId,
    });
    assert.equal(ninthAttempt.status, 429);
    assert.match(ninthAttempt.data.error, /Velocity limit exceeded/);
    console.log('✅ FRD-01: Velocity rate limit triggered HTTP 429 on 9th task start within 10 minutes.');

    // =========================================================================
    // TEST SUITE 7: TELEMETRY, EXPORT, CLOSURE REFUND & FINAL AUDIT (PRJ-01..04, FIN-07, FIN-08)
    // =========================================================================
    const telem = await apiCall(baseUrl, `/api/campaigns/${camp1.id}/telemetry`);
    assert.equal(telem.status, 200);
    assert.equal(telem.data.completedSlots, 1);
    assert.equal(telem.data.remainingSlots, 99);
    assert.equal(telem.data.spentBudget, 0.50);
    assert.equal(telem.data.remainingBudget, 49.50);

    const exported = await apiCall(baseUrl, `/api/campaigns/${camp1.id}/export`);
    assert.equal(exported.status, 200);
    assert.equal(exported.data.totalVerified, 1);
    assert.equal(exported.data.participants[0].username, '@user_alpha');

    const closeRes = await apiCall(baseUrl, `/api/campaigns/${camp1.id}/close`, 'POST');
    assert.equal(closeRes.status, 200);
    assert.equal(closeRes.data.refundAmount, 49.50);
    assert.equal(closeRes.data.campaign.status, 'CLOSED');
    console.log('✅ PRJ-03 / PRJ-04 / FIN-07: Telemetry, CSV export data, and $49.50 unclaimed escrow refund verified.');

    // Final Zero-Sum Solvency Audit (FIN-08)
    const finalAudit = await apiCall(baseUrl, '/api/admin/ledger/audit');
    assert.equal(finalAudit.status, 200);
    assert.equal(finalAudit.data.escrowBalanced, true);
    assert.equal(finalAudit.data.walletBalanced, true);
    assert.equal(finalAudit.data.isBalanced, true);
    console.log(
      `✅ FIN-08: Final Solvency Audit PASSED! Deposits=$${finalAudit.data.totalDeposits.toFixed(2)}, ` +
        `Fees=$${finalAudit.data.totalPlatformFees.toFixed(2)}, ` +
        `Earned=$${finalAudit.data.totalRewardsEarned.toFixed(2)}, ` +
        `Refunds=$${finalAudit.data.totalRefunds.toFixed(2)}, ` +
        `EscrowBalanced=${finalAudit.data.escrowBalanced}, WalletBalanced=${finalAudit.data.walletBalanced}\n`
    );

    console.log('🎉 ALL MASTER TEST PLAN API & INVARIANT SUITES PASSED 100%!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTestPlan().catch((err) => {
  console.error('❌ Test Plan failed:', err);
  process.exit(1);
});
