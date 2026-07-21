<?php
namespace App\Http\Controllers\Api\V1\Stock;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use App\Services\StockLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class StockTransferController extends Controller {
    public function __construct(private readonly StockLedgerService $ledgerService) {}
    public function index(Request $request) { $this->authorize("view-stock-transfers"); return response()->json(["data"=>StockTransfer::with(['fromWarehouse', 'toWarehouse', 'fromDepartment', 'toDepartment', 'initiatedBy', 'approvedBy'])->latest()->paginate($request->per_page??20)]); }
    public function store(Request $request): JsonResponse {
        $this->authorize("create-stock-transfers");
        $v = $request->validate(["transfer_type"=>"required|in:warehouse_to_warehouse,warehouse_to_department,department_to_warehouse","from_warehouse_id"=>"nullable|exists:warehouses,id","to_warehouse_id"=>"nullable|exists:warehouses,id","transfer_date"=>"required|date","reason"=>"nullable|string","items"=>"required|array|min:1","items.*.item_id"=>"required|exists:items,id","items.*.quantity"=>"required|numeric|min:0.001"]);
        DB::beginTransaction();
        try {
            $tn = "TRF-".date("Y")."-".str_pad(StockTransfer::count()+1,5,"0",STR_PAD_LEFT);
            $transfer = StockTransfer::create([...$v,"transfer_number"=>$tn,"initiated_by"=>auth()->id(),"status"=>"draft"]);
            foreach ($v["items"] as $i) { $transfer->items()->create($i); }
            DB::commit();
            AuditLog::record("stock_transfer_created","Transfer created: {$tn}",$transfer);
            return response()->json(["message"=>"Transfer created.","data"=>$transfer],201);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
    public function show(StockTransfer $stockTransfer): JsonResponse { return response()->json(["data"=>$stockTransfer]); }
    public function update(StockTransfer $stockTransfer, Request $request): JsonResponse { return response()->json(["message"=>"Updated"]); }
    public function destroy(StockTransfer $stockTransfer): JsonResponse { $stockTransfer->delete(); return response()->json(["message"=>"Deleted"]); }
    public function approve(StockTransfer $stockTransfer): JsonResponse {
        $this->authorize("approve-stock-transfers");
        DB::beginTransaction();
        try {
            foreach ($stockTransfer->items as $i) {
                $item = Item::find($i->item_id);
                if ($stockTransfer->from_warehouse_id) {
                    $from = Warehouse::find($stockTransfer->from_warehouse_id);
                    $this->ledgerService->record($item,$from,"transfer_out",$stockTransfer->transfer_number,"StockTransfer",$stockTransfer->id,0,$i->quantity,$item->average_cost);
                }
                if ($stockTransfer->to_warehouse_id) {
                    $to = Warehouse::find($stockTransfer->to_warehouse_id);
                    $this->ledgerService->record($item,$to,"transfer_in",$stockTransfer->transfer_number,"StockTransfer",$stockTransfer->id,$i->quantity,0,$item->average_cost);
                }
            }
            $stockTransfer->update(["status"=>"completed","approved_by"=>auth()->id(),"approved_at"=>now()]);
            DB::commit();
            return response()->json(["message"=>"Transfer approved and stock updated."]);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
}