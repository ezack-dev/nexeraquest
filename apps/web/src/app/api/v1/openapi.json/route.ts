import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'NexeraQuest REST API',
      version: '1.0.0',
      description: 'API documentation for NexeraQuest — Telegram-Native Web3 Campaign Marketplace.\nTagline: QUEST. CONTRIBUTE. EARN.',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Primary Production API Server',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'System Health & Engine Diagnostics',
          responses: {
            '200': {
              description: 'Returns database and ledger health telemetry',
            },
          },
        },
      },
      '/auth/telegram': {
        post: {
          summary: 'Telegram WebApp initData HMAC-SHA256 Validation',
          description: 'Validates cryptographic hash from Telegram WebApp client and issues authenticated session.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    initData: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Session issued with JWT token and profile' },
            '401': { description: 'HMAC signature mismatch or expired payload' },
          },
        },
      },
      '/campaigns': {
        get: {
          summary: 'Campaign Marketplace Discovery Feed',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', default: 'LIVE' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['highest_reward', 'newest', 'slots'] } },
          ],
          responses: {
            '200': { description: 'Filtered active campaigns list' },
          },
        },
        post: {
          summary: 'Create Campaign (Project Owner)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    rewardPerAction: { type: 'number' },
                    targetParticipants: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Campaign created in DRAFT state' },
          },
        },
      },
      '/campaigns/{id}': {
        get: {
          summary: 'Campaign Detail with Tasks & Economics',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Detailed campaign model' },
          },
        },
      },
      '/campaigns/{id}/fund': {
        post: {
          summary: 'Lock Campaign Escrow Funding',
          description: 'Transactionally locks required reward pool and fee into campaign escrow.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Escrow funded and status updated to FUNDED' },
          },
        },
      },
      '/tasks/{id}/start': {
        post: {
          summary: 'Start Quest Task Instance',
          description: 'Initializes a task instance for contributor. Prevents duplicate starts.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Task instance in IN_PROGRESS state' },
          },
        },
      },
      '/tasks/{id}/submit': {
        post: {
          summary: 'Submit Proof for Task Instance',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Proof recorded and attached to task instance' },
          },
        },
      },
      '/tasks/{id}/verify': {
        post: {
          summary: 'Trigger Verification Adapter & Settle Reward',
          description: 'Invokes modular verification adapter. If approved, transactionally credits reward to balance account and writes immutable ledger entry.',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Verification outcome and settlement result' },
          },
        },
      },
      '/wallet': {
        get: {
          summary: 'Contributor Balances & Double-Entry Ledger History',
          responses: {
            '200': { description: 'Available, Pending, Paid balances and transactions' },
          },
        },
      },
      '/wallet/withdraw': {
        post: {
          summary: 'Request Payout Cashout (Idempotent)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    network: { type: 'string' },
                    destinationAddress: { type: 'string' },
                    idempotencyKey: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Withdrawal created and pending balance updated' },
          },
        },
      },
      '/admin/reconciliation/run': {
        post: {
          summary: 'Trigger Full Double-Entry Ledger Reconciliation',
          responses: {
            '200': { description: 'Audit report verifying mathematical equality of balances and ledger events' },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
