<?php
namespace App\Http\Controllers\Api\V1\Store;
use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class UnitController extends Controller {
    public function index(Request $request): JsonResponse {
        $units = Unit::when($request->search, fn($q) => $q->where("name_en","like","%{$request->search}%"))->orderBy("name_en")->get();
        return response()->json(["data" => $units]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("manage-units");
        $v = $request->validate(["code"=>"required|string|unique:units","name_en"=>"required|string","name_si"=>"nullable|string","symbol"=>"nullable|string"]);
        $unit = Unit::create($v);
        return response()->json(["message"=>"Unit created.","data"=>$unit],201);
    }
    public function show(Unit $unit): JsonResponse { return response()->json(["data"=>$unit]); }
    public function update(Request $request, Unit $unit): JsonResponse {
        $this->authorize("manage-units");
        $unit->update($request->validate(["name_en"=>"sometimes|string","name_si"=>"nullable|string","symbol"=>"nullable|string","is_active"=>"sometimes|boolean"]));
        return response()->json(["message"=>"Unit updated.","data"=>$unit->fresh()]);
    }
    public function destroy(Unit $unit): JsonResponse { $this->authorize("manage-units"); $unit->delete(); return response()->json(["message"=>"Unit deleted."]); }
}