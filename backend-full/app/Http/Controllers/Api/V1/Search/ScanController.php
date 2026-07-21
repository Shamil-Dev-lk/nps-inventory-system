<?php

namespace App\Http\Controllers\Api\V1\Search;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanController extends Controller
{
    /**
     * Handle incoming barcode/QR scan from hardware scanner or webcam.
     */
    public function scan(Request $request)
    {
        $code = trim($request->input('code'));
        if (!$code) {
            return response()->json(['message' => 'Empty barcode'], 400);
        }

        // Try resolving by explicit prefixes (assuming standard system generated codes)
        if (str_starts_with($code, 'ITM-')) {
            $id = (int) str_replace('ITM-', '', $code);
            return response()->json(['data' => ['type' => 'item', 'id' => $id]]);
        }
        if (str_starts_with($code, 'AST-')) {
            $id = (int) str_replace('AST-', '', $code);
            return response()->json(['data' => ['type' => 'asset', 'id' => $id]]);
        }
        if (str_starts_with($code, 'GRN-')) {
            $id = (int) str_replace('GRN-', '', $code);
            return response()->json(['data' => ['type' => 'grn', 'id' => $id]]);
        }
        if (str_starts_with($code, 'PO-')) {
            $id = (int) str_replace('PO-', '', $code);
            return response()->json(['data' => ['type' => 'po', 'id' => $id]]);
        }

        // If no explicit prefix, attempt to search across common tables
        $item = DB::table('items')->where('sku', $code)->orWhere('barcode', $code)->first();
        if ($item) return response()->json(['data' => ['type' => 'item', 'id' => $item->id]]);

        $asset = DB::table('assets')->where('asset_tag', $code)->first();
        if ($asset) return response()->json(['data' => ['type' => 'asset', 'id' => $asset->id]]);

        $grn = DB::table('goods_received_notes')->where('grn_number', $code)->first();
        if ($grn) return response()->json(['data' => ['type' => 'grn', 'id' => $grn->id]]);

        $po = DB::table('purchase_orders')->where('po_number', $code)->first();
        if ($po) return response()->json(['data' => ['type' => 'po', 'id' => $po->id]]);

        return response()->json(['message' => 'Record not found for barcode: ' . $code], 404);
    }
}
