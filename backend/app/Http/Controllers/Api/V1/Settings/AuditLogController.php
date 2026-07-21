<?php
namespace App\Http\Controllers\Api\V1\Settings;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AuditLogController extends Controller {
    public function index(Request $request): JsonResponse {
        $this->authorize("view-audit-log");
        $logs = AuditLog::with("user")->when($request->user_id,fn($q)=>$q->where("user_id",$request->user_id))->when($request->action,fn($q)=>$q->where("action","like","%{$request->action}%"))->when($request->from_date,fn($q)=>$q->whereDate("created_at",">=",$request->from_date))->when($request->to_date,fn($q)=>$q->whereDate("created_at","<=",$request->to_date))->when($request->search,fn($q)=>$q->where("description","like","%{$request->search}%"))->orderByDesc("created_at")->paginate($request->per_page??50);
        return response()->json(["data"=>$logs]);
    }
    public function show(int $id): JsonResponse { $this->authorize("view-audit-log"); return response()->json(["data"=>AuditLog::with("user")->findOrFail($id)]); }
}