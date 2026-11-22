var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

function orderLine(overrides) {
  return Object.assign({
    id: 1,
    sku: 'RICE-1',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    qty: 1
  }, overrides || {});
}

test('invoice uses the HSN slab when gstRate is absent, matching the billed order', function () {
  var items = [orderLine()];
  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items });

  assert.deepEqual({
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total,
    lineGstPercent: billed.lines[0].gstPercent
  }, {
    subtotal: 100,
    discount: 0,
    tax: 5,
    total: 105,
    lineGstPercent: 5
  });

  assert.deepEqual({
    subtotal: printed.subtotal,
    discount: printed.discount,
    tax: printed.tax,
    cgst: printed.cgst,
    sgst: printed.sgst,
    total: printed.total,
    lineGstPercent: printed.rows[0].gstPercent
  }, {
    subtotal: 100,
    discount: 0,
    tax: 5,
    cgst: 2.5,
    sgst: 2.5,
    total: 105,
    lineGstPercent: 5
  });
});

test('invoice applies percent coupon to subtotal before calculating GST, matching the billed order', function () {
  var items = [orderLine({ price: 600, gstRate: 18 })];
  var billed = pricing.computeTotals(items, 'WELCOME');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'WELCOME' });

  assert.deepEqual({ discount: billed.discount, tax: billed.tax, total: billed.total }, {
    discount: 30,
    tax: 102.6,
    total: 672.6
  });
  assert.deepEqual({ discount: printed.discount, tax: printed.tax, total: printed.total }, {
    discount: 30,
    tax: 102.6,
    total: 672.6
  });
});

test('invoice HTML shows the billed total without a reconciliation notice when figures match', function () {
  var items = [orderLine()];
  var billed = pricing.computeTotals(items, '');
  var html = invoice.render({
    id: 7,
    date: '2026-11-22',
    customer: 'In-memory customer',
    items: items,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.match(html, /Invoice Total<\/td><td class="r">[^<]*105\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('GST reconciliation matches an HSN-only order', function () {
  var items = [orderLine()];
  var billed = pricing.computeTotals(items, '');
  var result = reports.getGstReconciliation({
    orders: [{
      id: 9,
      date: '2026-11-22',
      customer: 'In-memory customer',
      items: items,
      subtotal: billed.subtotal,
      discount: billed.discount,
      tax: billed.tax,
      total: billed.total
    }]
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.deepEqual({
    ledgerTax: result.rows[0].ledgerTax,
    invoiceTax: result.rows[0].invoiceTax,
    ledgerTotal: result.rows[0].ledgerTotal,
    invoiceTotal: result.rows[0].invoiceTotal,
    delta: result.rows[0].delta,
    matched: result.rows[0].matched
  }, {
    ledgerTax: 5,
    invoiceTax: 5,
    ledgerTotal: 105,
    invoiceTotal: 105,
    delta: 0,
    matched: true
  });
});
