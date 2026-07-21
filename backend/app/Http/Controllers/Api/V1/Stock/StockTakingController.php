<?php
namespace App\Http\Controllers\Api\V1\Stock;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\StockTaking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class StockTakingController extends Controller {
    public function index(Request $request) { $this->authorize("view-stock-taking"); return response()->json(["data"=>StockTaking::with("warehouse")->latest()->paginate($request->per_page??20)]); }
    public function store(Request $request): JsonResponse {
        $this->authorize("create-stock-taking");
        $v = $request->validate(["title"=>"required|string","warehouse_id"=>"required|exists:warehouses,id","count_date"=>"required|date","remarks"=>"nullable|string"]);
        $stn = "ST-".date("Y")."-".str_pad(StockTaking::count()+1,5,"0",STR_PAD_LEFT);
        $st = StockTaking::create([...$v,"st_number"=>$stn,"initiated_by"=>auth()->id(),"status"=>"draft"]);
        $items = Item::where("warehouse_id",$v["warehouse_id"])->where("is_active",true)->get();
        foreach ($items as $item) { $st->items()->create(["item_id"=>$item->id,"system_quantity"=>$item->current_quantity,"unit_cost"=>$item->average_cost]); }
        AuditLog::record("stock_taking_created","Stock taking created: {$stn}",$st);
        return response()->json(["message"=>"Stock taking created.","data"=>$st->load("items.item")],201);
    }
    public function show(StockTaking $stockTaking): JsonResponse { return response()->json(["data"=>$stockTaking->load(["warehouse","items.item"])]); }
    public function update(StockTaking $stockTaking, Request $request): JsonResponse { return response()->json(["message"=>"Updated"]); }
    public function destroy(StockTaking $stockTaking): JsonResponse { $stockTaking->delete(); return response()->json(["message"=>"Deleted"]); }
    public function start(StockTaking $stockTaking): JsonResponse { $stockTaking->update(["status"=>"in_progress"]); return response()->json(["message"=>"Stock taking started."]); }
    public function complete(Request $request, StockTaking $stockTaking): JsonResponse {
        $request->validate(["items"=>"required|array","items.*.id"=>"required|exists:stock_taking_items,id","items.*.physical_quantity"=>"required|numeric|min:0"]);
        DB::beginTransaction();
        try {
            foreach ($request->items as $i) {
                $stItem = $stockTaking->items()->find($i["id"]);
                $variance = $i["physical_quantity"] - $stItem->system_quantity;
                $stItem->update(["physical_quantity"=>$i["physical_quantity"],"variance"=>$variance,"variance_reason"=>$i["variance_reason"]??null]);
            }
            $stockTaking->update(["status"=>"completed"]);
            DB::commit();
            return response()->json(["message"=>"Stock taking completed."]);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
    public function approve(StockTaking $stockTaking): JsonResponse {
        $this->authorize("approve-stock-taking");
        $stockTaking->update(["status"=>"approved","approved_by"=>auth()->id(),"approved_at"=>now()]);
        AuditLog::record("stock_taking_approved","Stock taking approved: {$stockTaking->st_number}",$stockTaking);
        return response()->json(["message"=>"Stock taking approved."]);
    }
}