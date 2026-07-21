<?php
namespace App\Http\Controllers\Api\V1\Stock;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\StockReturn;
use App\Services\StockLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class StockReturnController extends Controller {
    public function __construct(private readonly StockLedgerService $ledgerService) {}
    public function index(Request $request) {
        $this->authorize("view-stock-returns");
        return response()->json(["data" => StockReturn::with(["warehouse","returnedBy"])->latest()->paginate($request->per_page??20)]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("create-stock-returns");
        $v = $request->validate(["warehouse_id"=>"required|exists:warehouses,id","return_date"=>"required|date","stock_issue_id"=>"nullable|exists:stock_issues,id","department_id"=>"nullable|exists:departments,id","remarks"=>"nullable|string","items"=>"required|array|min:1","items.*.item_id"=>"required|exists:items,id","items.*.quantity"=>"required|numeric|min:0.001","items.*.condition"=>"required|in:good,damaged,expired,unused","items.*.reason"=>"nullable|string"]);
        DB::beginTransaction();
        try {
            $rn = "RET-".date("Y")."-".str_pad(StockReturn::count()+1,5,"0",STR_PAD_LEFT);
            $ret = StockReturn::create([...$v,"return_number"=>$rn,"returned_by"=>auth()->id(),"status"=>"draft"]);
            foreach ($v["items"] as $i) { $ret->items()->create($i); }
            DB::commit();
            AuditLog::record("stock_return_created","Stock return created: {$rn}",$ret);
            return response()->json(["message"=>"Stock return created.","data"=>$ret->load("items.item")],201);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
    public function show(StockReturn $stockReturn): JsonResponse { $this->authorize("view-stock-returns"); return response()->json(["data"=>$stockReturn->load(["warehouse","items.item","returnedBy"])]); }
    public function update(StockReturn $stockReturn, Request $request): JsonResponse { return response()->json(["message"=>"Updated"]); }
    public function destroy(StockReturn $stockReturn): JsonResponse { $stockReturn->delete(); return response()->json(["message"=>"Deleted"]); }
    public function approve(StockReturn $stockReturn): JsonResponse {
        $this->authorize("approve-stock-returns");
        DB::beginTransaction();
        try {
            foreach ($stockReturn->items as $i) {
                $item = Item::find($i->item_id);
                if ($i->condition === "good") {
                    $this->ledgerService->record($item,$stockReturn->warehouse,"return",$stockReturn->return_number,"StockReturn",$stockReturn->id,$i->quantity,0,$item->average_cost,"Return: {$stockReturn->return_number}");
                }
            }
            $stockReturn->update(["status"=>"approved","approved_by"=>auth()->id(),"approved_at"=>now()]);
            DB::commit();
            return response()->json(["message"=>"Stock return approved."]);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
}