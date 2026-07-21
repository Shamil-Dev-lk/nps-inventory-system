import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

export function initializeMockAdapter(axiosInstance: any) {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });
  
  // Initialize storage
  const getStorage = (key: string) => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(key) || '[]');
  };
  const setStorage = (key: string, data: any) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
  };
  
  // Helper to intercept CRUD
  const interceptCrud = (endpoint: string, storageKey: string) => {
    // GET list
    mock.onGet(new RegExp(`^/v1/${endpoint}$`)).reply(() => {
      return [200, { data: getStorage(storageKey) }];
    });
    
    // GET single
    mock.onGet(new RegExp(`^/v1/${endpoint}/\\d+$`)).reply((config) => {
      const id = config.url?.split('/').pop();
      const items = getStorage(storageKey);
      const item = items.find((i: any) => i.id == id);
      return item ? [200, { data: item }] : [404];
    });
    
    // POST
    mock.onPost(new RegExp(`^/v1/${endpoint}$`)).reply((config) => {
      const items = getStorage(storageKey);
      const data = JSON.parse(config.data);
      const newItem = { ...data, id: Date.now() };
      items.push(newItem);
      setStorage(storageKey, items);
      return [201, { data: newItem }];
    });
    
    // PUT
    mock.onPut(new RegExp(`^/v1/${endpoint}/\\d+$`)).reply((config) => {
      const id = config.url?.split('/').pop();
      const items = getStorage(storageKey);
      const data = JSON.parse(config.data);
      const index = items.findIndex((i: any) => i.id == id);
      if (index >= 0) {
        items[index] = { ...items[index], ...data };
        setStorage(storageKey, items);
        return [200, { data: items[index] }];
      }
      return [404];
    });
    
    // DELETE
    mock.onDelete(new RegExp(`^/v1/${endpoint}/\\d+$`)).reply((config) => {
      const id = config.url?.split('/').pop();
      let items = getStorage(storageKey);
      items = items.filter((i: any) => i.id != id);
      setStorage(storageKey, items);
      return [200, { success: true }];
    });
  };

  // Auth mock
  mock.onPost('/v1/auth/login').reply(200, {
    token: 'mock-jwt-token-12345',
    user: { id: 1, name: 'Admin User', role: 'admin' }
  });
  
  mock.onPost('/v1/auth/logout').reply(200, { success: true });
  mock.onGet('/v1/auth/user').reply(200, { data: { id: 1, name: 'Admin User', role: 'admin' } });

  // Dashboard mock
  mock.onGet('/v1/dashboard/stats').reply(200, {
    data: {
      total_items: getStorage('items').length,
      total_customers: getStorage('customers').length,
      total_suppliers: getStorage('suppliers').length,
      low_stock_items: 0,
      recent_activities: []
    }
  });

  interceptCrud('categories', 'categories');
  interceptCrud('brands', 'brands');
  interceptCrud('units', 'units');
  interceptCrud('warehouses', 'warehouses');
  interceptCrud('items', 'items');
  interceptCrud('customers', 'customers');
  interceptCrud('suppliers', 'suppliers');
  interceptCrud('users', 'users');
  interceptCrud('stock/adjustment', 'stock_adjustments');
  interceptCrud('stock/grn', 'stock_grn');
  interceptCrud('stock/issue', 'stock_issue');
  interceptCrud('stock/return', 'stock_return');
  interceptCrud('stock/transfer', 'stock_transfer');
  interceptCrud('purchase/orders', 'purchase_orders');
  interceptCrud('purchase/requests', 'purchase_requests');

  // Fallback for everything else
  mock.onAny().reply((config) => {
    console.warn('Unhandled mock request:', config.method, config.url);
    return [404];
  });
}
