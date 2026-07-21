<?php

namespace App\Http\Controllers\Api\V1\Reports;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceivedNote;
use App\Models\Item;
use App\Models\StockIssue;
use App\Models\StockLedger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function currentStock(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $items = Item::with(['category', 'unit', 'warehouse'])
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->warehouse_id, fn($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->search, fn($q) => $q->where('name_en', 'like', "%{$request->search}%")
                ->orWhere('item_code', 'like', "%{$request->search}%"))
            ->orderBy('name_en')
            ->paginate($request->per_page ?? 50);

        return response()->json([
            'data' => $items,
            'summary' => [
                'total_items' => Item::count(),
                'total_value' => Item::selectRaw('COALESCE(SUM(current_quantity * average_cost), 0) as total')->value('total'),
                'low_stock_count' => Item::lowStock()->count(),
                'out_of_stock_count' => Item::outOfStock()->count(),
            ],
        ]);
    }

    public function stockLedger(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $entries = StockLedger::with(['item', 'warehouse'])
            ->when($request->item_id, fn($q) => $q->where('item_id', $request->item_id))
            ->when($request->warehouse_id, fn($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->from_date, fn($q) => $q->whereDate('transaction_date', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->whereDate('transaction_date', '<=', $request->to_date))
            ->when($request->transaction_type, fn($q) => $q->where('transaction_type', $request->transaction_type))
            ->orderBy('transaction_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $entries]);
    }

    public function grnReport(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $grns = GoodsReceivedNote::with(['supplier', 'warehouse', 'receivedBy'])
            ->when($request->from_date, fn($q) => $q->whereDate('received_date', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->whereDate('received_date', '<=', $request->to_date))
            ->when($request->supplier_id, fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('received_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json([
            'data' => $grns,
            'summary' => [
                'total_grns' => $grns->total(),
                'total_value' => GoodsReceivedNote::where('status', 'approved')->sum('total_amount'),
            ],
        ]);
    }

    public function issueReport(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $issues = StockIssue::with(['department', 'officer', 'warehouse', 'issuedBy'])
            ->when($request->from_date, fn($q) => $q->whereDate('issue_date', '>=', $request->from_date))
            ->when($request->to_date, fn($q) => $q->whereDate('issue_date', '<=', $request->to_date))
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderBy('issue_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $issues]);
    }

    public function purchaseReport(Request $request): JsonResponse
    {
        $this->authorize('view-reports');
        return response()->json(['data' => [], 'message' => 'Purchase report']);
    }

    public function supplierReport(Request $request): JsonResponse
    {
        $this->authorize('view-reports');
        return response()->json(['data' => [], 'message' => 'Supplier report']);
    }

    public function lowStock(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $items = Item::with(['category', 'unit', 'warehouse'])
            ->lowStock()->where('is_active', true)
            ->orderBy('current_quantity')
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $items, 'count' => $items->total()]);
    }

    public function zeroStock(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $items = Item::with(['category', 'unit'])
            ->outOfStock()->where('is_active', true)
            ->orderBy('name_en')
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $items, 'count' => $items->total()]);
    }

    public function deadStock(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $cutoffDate = now()->subMonths(6);
        $items = Item::with(['category', 'unit'])
            ->where('current_quantity', '>', 0)
            ->whereDoesntHave('ledgerEntries', fn($q) => $q->where('transaction_date', '>=', $cutoffDate))
            ->orderBy('name_en')
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $items]);
    }

    public function fastMoving(Request $request): JsonResponse
    {
        $this->authorize('view-reports');
        return response()->json(['data' => []]);
    }

    public function slowMoving(Request $request): JsonResponse
    {
        $this->authorize('view-reports');
        return response()->json(['data' => []]);
    }

    public function expiryReport(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $items = Item::with(['category', 'unit'])
            ->expiringSoon($request->days ?? 30)
            ->paginate($request->per_page ?? 50);

        return response()->json(['data' => $items]);
    }

    public function dashboardAnalytics(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $currentMonth = now()->startOfMonth();
        $lastMonth    = now()->subMonth()->startOfMonth();

        return response()->json([
            'inventory' => [
                'total_items'          => Item::where('is_active', true)->count(),
                'total_value'          => Item::selectRaw('COALESCE(SUM(current_quantity * average_cost), 0) as total')->value('total'),
                'low_stock_count'      => Item::lowStock()->count(),
                'out_of_stock_count'   => Item::outOfStock()->count(),
                'expiring_soon_count'  => Item::expiringSoon(30)->count(),
            ],
            'monthly_grn' => [
                'this_month' => GoodsReceivedNote::where('status', 'approved')->whereDate('received_date', '>=', $currentMonth)->sum('total_amount'),
                'last_month' => GoodsReceivedNote::where('status', 'approved')->whereDate('received_date', '>=', $lastMonth)->whereDate('received_date', '<', $currentMonth)->sum('total_amount'),
                'count'      => GoodsReceivedNote::whereDate('received_date', '>=', $currentMonth)->count(),
            ],
            'monthly_issues' => [
                'this_month' => StockIssue::where('status', 'issued')->whereDate('issue_date', '>=', $currentMonth)->count(),
                'last_month' => StockIssue::where('status', 'issued')->whereDate('issue_date', '>=', $lastMonth)->whereDate('issue_date', '<', $currentMonth)->count(),
            ],
            'recent_grns'   => GoodsReceivedNote::with('supplier')->latest()->take(5)->get(),
            'recent_issues' => StockIssue::with('department')->latest()->take(5)->get(),
            'stock_by_category' => Item::selectRaw('category_id, COUNT(*) as count, COALESCE(SUM(current_quantity * average_cost), 0) as value')
                ->with('category')->groupBy('category_id')->get(),
            'monthly_trend' => $this->getMonthlyTrend(),
        ]);
    }

    private function getMonthlyTrend(): array
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $months->push([
                'month'        => $month->format('M Y'),
                'grn_value'    => GoodsReceivedNote::where('status', 'approved')->whereYear('received_date', $month->year)->whereMonth('received_date', $month->month)->sum('total_amount'),
                'issues_count' => StockIssue::where('status', 'issued')->whereYear('issue_date', $month->year)->whereMonth('issue_date', $month->month)->count(),
            ]);
        }
        return $months->toArray();
    }

    public function export(Request $request, string $type, string $format)
    {
        $this->authorize('export-reports');

        $data = match ($type) {
            'current-stock' => Item::with(['category', 'unit'])->get()->toArray(),
            'low-stock'     => Item::with(['category', 'unit'])->lowStock()->get()->toArray(),
            'grn'           => GoodsReceivedNote::with(['supplier'])->latest()->take(500)->get()->toArray(),
            default         => [],
        };

        return match ($format) {
            'pdf' => $this->exportPdf($type, $data),
            'csv' => $this->exportCsv($type, $data),
            default => response()->json(['message' => 'Unsupported format'], 422),
        };
    }

    private function exportPdf(string $type, array $data)
    {
        $org = \App\Models\OrganizationSetting::getInstance();
        $pdf = Pdf::loadView("pdf.reports.{$type}", compact('data', 'org'))->setPaper('a4', 'landscape');
        return $pdf->download("{$type}-report-" . date('Y-m-d') . '.pdf');
    }

    private function exportCsv(string $type, array $data)
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename={$type}-" . date('Y-m-d') . '.csv',
        ];
        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            if (!empty($data)) {
                fputcsv($file, array_keys($data[0]));
                foreach ($data as $row) {
                    fputcsv($file, $row);
                }
            }
            fclose($file);
        };
        return response()->stream($callback, 200, $headers);
    }
}
