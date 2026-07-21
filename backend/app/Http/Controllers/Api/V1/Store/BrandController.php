<?php
namespace App\Http\Controllers\Api\V1\Store;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BrandController extends Controller {
    public function index(Request $request): JsonResponse {
        $brands = Brand::when($request->search, fn($q)=>$q->where("name","like","%{$request->search}%"))->orderBy("name")->get();
        return response()->json(["data"=>$brands]);
    }
    public function store(Request $request): JsonResponse {
        $this->authorize("manage-brands");
        $brand = Brand::create($request->validate(["code"=>"required|string|unique:brands","name"=>"required|string","country"=>"nullable|string"]));
        return response()->json(["message"=>"Brand created.","data"=>$brand],201);
    }
    public function show(Brand $brand): JsonResponse { return response()->json(["data"=>$brand]); }
    public function update(Request $request, Brand $brand): JsonResponse {
        $this->authorize("manage-brands");
        $brand->update($request->validate(["name"=>"sometimes|string","country"=>"nullable|string","is_active"=>"sometimes|boolean"]));
        return response()->json(["message"=>"Brand updated.","data"=>$brand->fresh()]);
    }
    public function destroy(Brand $brand): JsonResponse { $this->authorize("manage-brands"); $brand->delete(); return response()->json(["message"=>"Brand deleted."]); }
}