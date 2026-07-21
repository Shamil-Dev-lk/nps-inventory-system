<?php
namespace App\Http\Controllers\Api\V1\Stock;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\GoodsReceivedNote;
use App\Models\Item;
use App\Models\Warehouse;
use App\Services\StockLedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class GrnController extends Controller {
    public function __construct(private readonly StockLedgerService $ledgerService) {}
    public function index(Request $request) {
        $this->authorize("view-grn");
        $grns = GoodsReceivedNote::with(["supplier","warehouse","receivedBy"])
            ->when($request->search, fn($q)=>$q->where("grn_number","like","%{$request->search}%")->orWhereHas("supplier",fn($sq)=>$sq->where("company_name","like","%{$request->search}%")))
            ->when($request->status, fn($q)=>$q->where("status",$request->status))
            ->when($request->supplier_id, fn($q)=>$q->where("supplier_id",$request->supplier_id))
            ->when($request->from_date, fn($q)=>$q->whereDate("received_date",">=",$request->from_date))
            ->when($request->to_date, fn($q)=>$q->whereDate("received_date","<=",$request->to_date))
            ->latest("received_date")->paginate($request->per_page??20);
        return response()->json(["data"=>$grns]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("create-grn");
        $v = $request->validate([
            "supplier_id"=>"required|exists:suppliers,id","warehouse_id"=>"required|exists:warehouses,id",
            "received_date"=>"required|date","invoice_number"=>"nullable|string",
            "invoice_date"=>"nullable|date","delivery_note"=>"nullable|string","remarks"=>"nullable|string",
            "items"=>"required|array|min:1","items.*.item_id"=>"required|exists:items,id",
            "items.*.received_quantity"=>"required|numeric|min:0.001","items.*.accepted_quantity"=>"required|numeric|min:0",
            "items.*.unit_price"=>"required|numeric|min:0","items.*.batch_number"=>"nullable|string",
            "items.*.expiry_date"=>"nullable|date","items.*.remarks"=>"nullable|string",
        ]);
        DB::beginTransaction();
        try {
            $subtotal = collect($v["items"])->sum(fn($i)=>$i["accepted_quantity"]*$i["unit_price"]);
            $grnNumber = "GRN-".date("Y")."-".str_pad(GoodsReceivedNote::count()+1,5,"0",STR_PAD_LEFT);
            $grn = GoodsReceivedNote::create([
                ...$v,"grn_number"=>$grnNumber,"subtotal"=>$subtotal,"total_amount"=>$subtotal,
                "received_by"=>auth()->id(),"status"=>"draft",
            ]);
            foreach ($v["items"] as $i) {
                $grn->items()->create([...$i,"ordered_quantity"=>$i["received_quantity"],"rejected_quantity"=>max(0,$i["received_quantity"]-$i["accepted_quantity"]),"total_price"=>$i["accepted_quantity"]*$i["unit_price"]]);
            }
            DB::commit();
            AuditLog::record("grn_created","GRN created: {$grnNumber}",$grn);
            return response()->json(["message"=>"GRN created.","data"=>$grn->load(["supplier","warehouse","items.item"])],201);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
    public function show(GoodsReceivedNote $grn): JsonResponse {
        $this->authorize("view-grn");
        return response()->json(["data"=>$grn->load(["supplier","warehouse","items.item","receivedBy","approvedBy"])]);
    }
    public function update(Request $request, GoodsReceivedNote $grn): JsonResponse {
        $this->authorize("create-grn");
        if ($grn->status !== "draft") return response()->json(["message"=>"Only draft GRNs can be edited."],422);
        $grn->update($request->validate(["remarks"=>"nullable|string","invoice_number"=>"nullable|string"]));
        return response()->json(["message"=>"GRN updated.","data"=>$grn->fresh()]);
    }
    public function destroy(GoodsReceivedNote $grn): JsonResponse {
        $this->authorize("create-grn");
        if ($grn->status !== "draft") return response()->json(["message"=>"Only draft GRNs can be deleted."],422);
        $grn->delete();
        return response()->json(["message"=>"GRN deleted."]);
    }
    public function approve(Request $request, GoodsReceivedNote $grn): JsonResponse {
        $this->authorize("approve-grn");
        if ($grn->status !== "draft") return response()->json(["message"=>"Only draft GRNs can be approved."],422);
        DB::beginTransaction();
        try {
            foreach ($grn->items as $grnItem) {
                $item = Item::find($grnItem->item_id);
                $warehouse = Warehouse::find($grn->warehouse_id);
                if ($grnItem->accepted_quantity > 0) {
                    $this->ledgerService->record($item,$warehouse,"grn",$grn->grn_number,"GoodsReceivedNote",$grn->id,$grnItem->accepted_quantity,0,$grnItem->unit_price,"GRN: {$grn->grn_number}");
                }
            }
            $grn->update(["status"=>"approved","approved_by"=>auth()->id(),"approved_at"=>now()]);
            DB::commit();
            AuditLog::record("grn_approved","GRN approved: {$grn->grn_number}",$grn);
            return response()->json(["message"=>"GRN approved and stock updated."]);
        } catch(\Exception $e) { DB::rollBack(); return response()->json(["message"=>$e->getMessage()],500); }
    }
    public function reject(Request $request, GoodsReceivedNote $grn): JsonResponse {
        $this->authorize("approve-grn");
        $request->validate(["rejection_reason"=>"required|string"]);
        $grn->update(["status"=>"rejected","approved_by"=>auth()->id(),"approved_at"=>now(),"rejection_reason"=>$request->rejection_reason]);
        AuditLog::record("grn_rejected","GRN rejected: {$grn->grn_number}",$grn);
        return response()->json(["message"=>"GRN rejected."]);
    }
}