<?php
namespace App\Http\Controllers\Api\V1\Stock;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\StockAdjustment;
use App\Models\Warehouse;
use App\Services\StockLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class StockAdjustmentController extends Controller {
    public function __construct(private readonly StockLedgerService $ledgerService) {}
    public function index(Request $request) { $this->authorize("view-stock-adjustments"); return response()->json(["data"=>StockAdjustment::with(["item","warehouse"])->latest()->paginate($request->per_page??20)]); }
    public function store(Request $request): JsonResponse {
        $this->authorize("create-stock-adjustments");
        $v = $request->validate(["adjustment_type"=>"required|in:increase,decrease","item_id"=>"required|exists:items,id","warehouse_id"=>"required|exists:warehouses,id","quantity"=>"required|numeric|min:0.001","reason"=>"required|string","description"=>"nullable|string","adjustment_date"=>"required|date","unit_cost"=>"nullable|numeric|min:0"]);
        $an = "ADJ-".date("Y")."-".str_pad(StockAdjustment::count()+1,5,"0",STR_PAD_LEFT);
        $adj = StockAdjustment::create([...$v,"adjustment_number"=>$an,"adjusted_by"=>auth()->id(),"status"=>"draft"]);
        AuditLog::record("stock_adjustment_created","Adjustment created: {$an}",$adj);
        return response()->json(["message"=>"Adjustment created.","data"=>$adj],201);
    }
    public function show(StockAdjustment $stockAdjustment): JsonResponse { return response()->json(["data"=>$stockAdjustment->load(["item","warehouse"])]); }
    public function update(StockAdjustment $stockAdjustment, Request $request): JsonResponse { return response()->json(["message"=>"Updated"]); }
    public function destroy(StockAdjustment $stockAdjustment): JsonResponse { $stockAdjustment->delete(); return response()->json(["message"=>"Deleted"]); }
    public function approve(StockAdjustment $stockAdjustment): JsonResponse {
        $this->authorize("approve-stock-adjustments");
        DB::beginTransaction();
        try {
            $item = Item::find($stockAdjustment->item_id);
            $warehouse = Warehouse::find($stockAdjustment->warehouse_id);
            $qtyIn = $stockAdjustment->adjustment_type === "increase" ? $stockAdjustment->quantity : 0;
            $qtyOut = $stockAdjustment->adjustment_type === "decrease" ? $stockAdjustment->quantity : 0;
            $this->ledgerService->record($item,$warehouse,"adjustment_{$stockAdjustment->adjustment_type}",$stockAdjustment->adjustment_number,"StockAdjustment",$stockAdjustment->id,$qtyIn,$qtyOut,$stockAdjustment->unit_cost??$item->average_cost,$stockAdjustment->reason);
            $stockAdjustment->update(["status"=>"approved","approved_by"=>auth()->id(),"approved_at"=>now()]);
            DB::commit();
            AuditLog::record("stock_adjustment_approved","Adjustment approved: {$stockAdjustment->adjustment_number}",$stockAdjustment);
            return response()->json(["message"=>"Stock adjustment approved."]);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
}