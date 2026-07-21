<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceivedNote;
use App\Models\StockIssue;
use App\Models\StockReturn;
use App\Models\StockTransfer;
use App\Models\StockAdjustment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class PdfExportController extends Controller
{
    public function exportGrn(GoodsReceivedNote $grn)
    {
        $this->authorize('view-grn');
        $grn->load(['supplier', 'warehouse', 'items.item', 'receivedBy', 'approvedBy']);

        $data = [
            'title' => 'Goods Received Note',
            'details' => [
                'GRN Number' => $grn->grn_number,
                'Supplier' => $grn->supplier?->company_name ?? 'N/A',
                'Warehouse' => $grn->warehouse?->name_en ?? 'N/A',
                'Received Date' => $grn->received_date?->format('Y-m-d') ?? 'N/A',
                'Invoice Number' => $grn->invoice_number ?? 'N/A',
                'Status' => ucfirst($grn->status),
            ],
            'items' => $grn->items->map(fn($i) => [
                'code' => $i->item->item_code,
                'name' => $i->item->name_en,
                'quantity' => $i->accepted_quantity,
                'price' => $i->unit_price,
                'total' => $i->total_price,
                'unit' => $i->item->unit?->symbol,
            ]),
            'show_price' => true,
            'total_amount' => $grn->total_amount,
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("GRN-{$grn->grn_number}.pdf");
    }

    public function exportIssue(StockIssue $issue)
    {
        $this->authorize('view-stock-issues');
        $issue->load(['department', 'warehouse', 'items.item', 'issuedBy', 'approvedBy']);

        $issuedTo = match ($issue->issue_to_type) {
            'department' => $issue->department?->name_en,
            'officer' => $issue->officer?->name,
            'project' => $issue->project?->name_en,
            'customer' => $issue->customer?->name,
            default => 'Unknown',
        };

        $data = [
            'title' => 'Stock Issue Note',
            'details' => [
                'Issue Number' => $issue->issue_number,
                'Issued To' => $issuedTo ?? 'N/A',
                'Type' => ucfirst($issue->issue_to_type),
                'Warehouse' => $issue->warehouse?->name_en ?? 'N/A',
                'Issue Date' => $issue->issue_date?->format('Y-m-d') ?? 'N/A',
                'Status' => ucfirst($issue->status),
            ],
            'items' => $issue->items->map(fn($i) => [
                'code' => $i->item->item_code,
                'name' => $i->item->name_en,
                'quantity' => $i->quantity,
                'price' => $i->unit_price,
                'total' => $i->total_price,
                'unit' => $i->item->unit?->symbol,
            ]),
            'show_price' => true,
            'total_amount' => $issue->items->sum('total_price'),
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("Issue-{$issue->issue_number}.pdf");
    }

    public function exportReturn(StockReturn $return)
    {
        $this->authorize('view-stock-issues'); // Assuming same permission for now
        $return->load(['warehouse', 'department', 'officer', 'items.item']);

        $returnedBy = $return->department?->name_en ?? $return->officer?->name ?? 'N/A';

        $data = [
            'title' => 'Stock Return Note',
            'details' => [
                'Return Number' => $return->return_number,
                'Returned By' => $returnedBy,
                'To Warehouse' => $return->warehouse?->name_en ?? 'N/A',
                'Return Date' => $return->return_date?->format('Y-m-d') ?? 'N/A',
                'Status' => ucfirst($return->status),
            ],
            'items' => $return->items->map(fn($i) => [
                'code' => $i->item->item_code,
                'name' => $i->item->name_en,
                'quantity' => $i->quantity,
                'price' => $i->unit_price,
                'total' => $i->total_price,
                'unit' => $i->item->unit?->symbol,
            ]),
            'show_price' => true,
            'total_amount' => $return->items->sum('total_price'),
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("Return-{$return->return_number}.pdf");
    }

    public function exportTransfer(StockTransfer $transfer)
    {
        $this->authorize('view-stock-transfers');
        $transfer->load(['fromWarehouse', 'toWarehouse', 'fromDepartment', 'toDepartment', 'items.item']);

        $from = $transfer->transfer_type === 'warehouse_to_warehouse' 
                ? $transfer->fromWarehouse?->name_en 
                : $transfer->fromDepartment?->name_en;
        $to = $transfer->transfer_type === 'warehouse_to_warehouse' 
                ? $transfer->toWarehouse?->name_en 
                : $transfer->toDepartment?->name_en;

        $data = [
            'title' => 'Stock Transfer Note',
            'details' => [
                'Transfer Number' => $transfer->transfer_number,
                'Type' => ucwords(str_replace('_', ' ', $transfer->transfer_type)),
                'From' => $from ?? 'N/A',
                'To' => $to ?? 'N/A',
                'Transfer Date' => $transfer->transfer_date?->format('Y-m-d') ?? 'N/A',
                'Status' => ucfirst($transfer->status),
            ],
            'items' => $transfer->items->map(fn($i) => [
                'code' => $i->item->item_code,
                'name' => $i->item->name_en,
                'quantity' => $i->quantity,
                'price' => 0,
                'total' => 0,
                'unit' => $i->item->unit?->symbol,
            ]),
            'show_price' => false,
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("Transfer-{$transfer->transfer_number}.pdf");
    }

    public function exportAdjustment(StockAdjustment $adjustment)
    {
        $this->authorize('view-stock-adjustments');
        $adjustment->load(['warehouse', 'item']);

        $data = [
            'title' => 'Stock Adjustment Note',
            'details' => [
                'Adjustment Number' => $adjustment->adjustment_number,
                'Type' => ucfirst($adjustment->adjustment_type),
                'Warehouse' => $adjustment->warehouse?->name_en ?? 'N/A',
                'Adjustment Date' => $adjustment->adjustment_date?->format('Y-m-d') ?? 'N/A',
                'Reason' => $adjustment->reason ?? 'N/A',
                'Status' => ucfirst($adjustment->status),
            ],
            'items' => [[
                'code' => $adjustment->item->item_code,
                'name' => $adjustment->item->name_en,
                'quantity' => $adjustment->quantity,
                'price' => $adjustment->unit_cost,
                'total' => $adjustment->quantity * $adjustment->unit_cost,
                'unit' => $adjustment->item->unit?->symbol,
            ]],
            'show_price' => true,
            'total_amount' => $adjustment->quantity * $adjustment->unit_cost,
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("Adjustment-{$adjustment->adjustment_number}.pdf");
    }

    public function exportCustomer(\App\Models\Customer $customer)
    {
        $data = [
            'title' => 'Customer Profile Details',
            'details' => [
                'Customer ID' => $customer->id,
                'Name' => $customer->name ?? 'N/A',
                'ID Number / NIC' => $customer->nic ?? 'N/A',
                'Job Role / Designation' => $customer->designation ?? 'N/A',
                'Phone Number' => $customer->phone ?? 'N/A',
                'Email Address' => $customer->email ?? 'N/A',
                'Registered Date' => $customer->created_at ? $customer->created_at->format('Y-m-d') : 'N/A',
                'Address' => $customer->address ?? 'N/A',
            ],
            'items' => [],
            'show_price' => false,
        ];

        return Pdf::loadView('pdf.transaction', $data)->download("Customer-Profile-{$customer->id}.pdf");
    }
}
