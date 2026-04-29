import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { shopApi, Category, Product, ProductImage, ProductReview } from "@/lib/shop-api";

// ── Вспомогательные компоненты ────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${className}`}>{children}</span>;
}

// ── Форма товара ──────────────────────────────────────────────────────────────

function ProductForm({
  initial, categories, onSave, onCancel,
}: {
  initial?: Partial<Product>;
  categories: Category[];
  onSave: (data: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    price: initial?.price != null ? String(initial.price) : "",
    price_old: initial?.price_old != null ? String(initial.price_old) : "",
    sku: initial?.sku || "",
    category_id: initial?.category_id ? String(initial.category_id) : "",
    in_stock: initial?.in_stock ?? true,
    is_active: initial?.is_active ?? true,
    sort_order: initial?.sort_order != null ? String(initial.sort_order) : "0",
    image_url: initial?.image_url || "",
  });
  const [imageB64, setImageB64] = useState("");
  const [imageType, setImageType] = useState("image/jpeg");
  const [preview, setPreview] = useState(initial?.image_url || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageType(file.type);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImageB64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data: Record<string, unknown> = {
      ...initial?.id ? { id: initial.id } : {},
      name: form.name,
      description: form.description,
      price: form.price ? parseFloat(form.price) : null,
      price_old: form.price_old ? parseFloat(form.price_old) : null,
      sku: form.sku,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      in_stock: form.in_stock,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    if (imageB64) { data.image_b64 = imageB64; data.image_type = imageType; }
    else if (form.image_url) data.image_url = form.image_url;
    await onSave(data);
    setSaving(false);
  }

  const f = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Название *</label>
          <input value={form.name} onChange={e => f("name", e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Категория</label>
          <select value={form.category_id} onChange={e => f("category_id", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 bg-white">
            <option value="">Без категории</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Артикул (SKU)</label>
          <input value={form.sku} onChange={e => f("sku", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Цена (₽)</label>
          <input type="number" value={form.price} onChange={e => f("price", e.target.value)} min="0" step="0.01"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Старая цена (₽)</label>
          <input type="number" value={form.price_old} onChange={e => f("price_old", e.target.value)} min="0" step="0.01"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Описание</label>
          <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none" />
        </div>

        {/* Фото */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Фото товара</label>
          <div className="flex items-start gap-4">
            {preview && (
              <img src={preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
            )}
            <div className="flex-1">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors w-full justify-center">
                <Icon name="Upload" size={16} />
                {preview ? "Заменить фото" : "Загрузить фото"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <p className="text-xs text-gray-400 mt-1 text-center">JPG, PNG до 5 МБ</p>
            </div>
          </div>
        </div>

        {/* Переключатели */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => f("in_stock", !form.in_stock)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.in_stock ? "bg-green-500" : "bg-gray-200"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.in_stock ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700">В наличии</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => f("is_active", !form.is_active)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? "bg-green-500" : "bg-gray-200"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700">Активен</span>
          </label>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Порядок сортировки</label>
          <input type="number" value={form.sort_order} onChange={e => f("sort_order", e.target.value)} min="0"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "#3ca615" }}>
          {saving ? "Сохранение..." : initial?.id ? "Сохранить" : "Добавить товар"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ── Форма категории ───────────────────────────────────────────────────────────

function CategoryForm({ initial, onSave, onCancel }: {
  initial?: Partial<Category>;
  onSave: (data: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ name: initial?.name || "", description: initial?.description || "", sort_order: String(initial?.sort_order ?? 0) });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...initial?.id ? { id: initial.id } : {}, ...form, sort_order: parseInt(form.sort_order) || 0 });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Название *</label>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Описание</label>
        <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Порядок</label>
        <input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} min="0"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#3ca615" }}>
          {saving ? "Сохранение..." : initial?.id ? "Сохранить" : "Добавить"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ── Управление доп. фото и отзывами ──────────────────────────────────────────

function ProductExtras({ product }: { product: Product }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  async function loadExtras() {
    const [iRes, rRes] = await Promise.all([
      shopApi.getImages(product.id),
      shopApi.getReviews(product.id, true),
    ]);
    if (iRes.images) setImages(iRes.images);
    if (rRes.reviews) setReviews(rRes.reviews);
  }

  useEffect(() => { loadExtras(); }, [product.id]);

  function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const result = ev.target?.result as string;
      const b64 = result.split(",")[1];
      const type = file.type;
      await shopApi.uploadImage(product.id, b64, type);
      await loadExtras();
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDeleteImg(id: number) {
    await shopApi.deleteImage(id);
    setImages(prev => prev.filter(i => i.id !== id));
  }

  async function handleToggleReview(r: ProductReview) {
    await shopApi.publishReview(r.id, !r.is_published);
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, is_published: !x.is_published } : x));
  }

  async function handleDeleteReview(id: number) {
    await shopApi.deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="mt-5 space-y-5">
      {/* Доп. фото */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 text-sm">Дополнительные фото</h4>
          <button onClick={() => imgRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "#3ca615" }}>
            <Icon name="Upload" size={13} />
            {uploading ? "Загрузка..." : "Добавить фото"}
          </button>
          <input ref={imgRef} type="file" accept="image/*" onChange={handleImgUpload} className="hidden" />
        </div>
        {images.length === 0
          ? <p className="text-xs text-gray-400 text-center py-4">Нет дополнительных фото</p>
          : <div className="flex flex-wrap gap-3">
              {images.map(img => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
                  <button onClick={() => handleDeleteImg(img.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="X" size={10} />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Отзывы */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-900 text-sm mb-4">Отзывы ({reviews.length})</h4>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${r.is_published ? "border-green-100 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-900">{r.author_name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Icon key={i} name="Star" size={11} className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                    </div>
                    <Badge className={r.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                      {r.is_published ? "Опубликован" : "На модерации"}
                    </Badge>
                  </div>
                  {r.text && <p className="text-xs text-gray-600 line-clamp-2">{r.text}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggleReview(r)} title={r.is_published ? "Скрыть" : "Опубликовать"}
                    className={`p-1.5 rounded-lg transition-colors ${r.is_published ? "text-gray-400 hover:text-orange-500 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}>
                    <Icon name={r.is_published ? "EyeOff" : "Eye"} size={14} />
                  </button>
                  <button onClick={() => handleDeleteReview(r.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export default function AdminShop() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        shopApi.getProducts({ admin: "1" }),
        shopApi.getCategories(),
      ]);
      if (pRes.products) setProducts(pRes.products);
      if (cRes.categories) setCategories(cRes.categories);
    } catch { setError("Ошибка загрузки"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSaveProduct(data: object) {
    const res = editProduct
      ? await shopApi.updateProduct(data)
      : await shopApi.createProduct(data);
    if (res.ok || res.id) { setShowProductForm(false); setEditProduct(null); loadAll(); }
    else setError(res.error || "Ошибка сохранения");
  }

  async function handleDeleteProduct(id: number) {
    if (!confirm("Удалить товар?")) return;
    await shopApi.deleteProduct(id);
    loadAll();
  }

  async function handleSaveCat(data: object) {
    const res = editCat
      ? await shopApi.updateCategory(data as Partial<Category>)
      : await shopApi.createCategory(data as Partial<Category>);
    if (res.ok || res.id) { setShowCatForm(false); setEditCat(null); loadAll(); }
    else setError(res.error || "Ошибка сохранения");
  }

  async function handleDeleteCat(id: number) {
    if (!confirm("Удалить категорию? Товары останутся без категории.")) return;
    await shopApi.deleteCategory(id);
    loadAll();
  }

  function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = btoa(unescape(encodeURIComponent(ev.target?.result as string)));
      const res = await shopApi.importCsv(b64);
      setImportLoading(false);
      if (res.ok) { alert(`Импортировано: ${res.imported} товаров`); loadAll(); }
      else setError(res.error || "Ошибка импорта");
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  const filtered = products.filter(p => {
    if (catFilter && String(p.category_id) !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Магазин</h2>
        <div className="flex gap-2">
          {tab === "products" && (
            <>
              <button onClick={() => csvRef.current?.click()} disabled={importLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-400 transition-colors">
                <Icon name="FileSpreadsheet" size={15} />
                {importLoading ? "Импорт..." : "Импорт CSV"}
              </button>
              <input ref={csvRef} type="file" accept=".csv,.txt" onChange={handleImportCsv} className="hidden" />
              <button onClick={() => { setEditProduct(null); setShowProductForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "#3ca615" }}>
                <Icon name="Plus" size={15} />
                Добавить товар
              </button>
            </>
          )}
          {tab === "categories" && (
            <button onClick={() => { setEditCat(null); setShowCatForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "#3ca615" }}>
              <Icon name="Plus" size={15} />
              Добавить категорию
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex justify-between">
          {error}
          <button onClick={() => setError("")}><Icon name="X" size={14} /></button>
        </div>
      )}

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        {(["products", "categories"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
            {t === "products" ? `Товары (${products.length})` : `Категории (${categories.length})`}
          </button>
        ))}
      </div>

      {/* ── ТОВАРЫ ── */}
      {tab === "products" && (
        <>
          {(showProductForm || editProduct) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <h3 className="font-semibold text-gray-900 mb-4">{editProduct ? "Редактировать товар" : "Новый товар"}</h3>
              <ProductForm
                initial={editProduct || undefined}
                categories={categories}
                onSave={handleSaveProduct}
                onCancel={() => { setShowProductForm(false); setEditProduct(null); }}
              />
              {editProduct && <ProductExtras product={editProduct} />}
            </div>
          )}

          {/* Поиск и фильтр */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
              <option value="">Все категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Загрузка...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Таблица на широких */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                      <th className="text-left px-4 py-3">Фото</th>
                      <th className="text-left px-4 py-3">Название / Артикул</th>
                      <th className="text-left px-4 py-3">Категория</th>
                      <th className="text-left px-4 py-3">Цена</th>
                      <th className="text-left px-4 py-3">Статус</th>
                      <th className="text-left px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                            : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Icon name="Package" size={20} className="text-gray-300" /></div>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400">{p.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.category_name || "—"}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {p.price != null ? `${p.price.toLocaleString("ru-RU")} ₽` : "—"}
                          </p>
                          {p.price_old != null && (
                            <p className="text-xs text-gray-400 line-through">{p.price_old.toLocaleString("ru-RU")} ₽</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge className={p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                              {p.is_active ? "Активен" : "Скрыт"}
                            </Badge>
                            <Badge className={p.in_stock ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}>
                              {p.in_stock ? "В наличии" : "Нет"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditProduct(p); setShowProductForm(false); }}
                              className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                              <Icon name="Pencil" size={15} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <Icon name="Trash2" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Нет товаров</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Карточки на мобиле */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map(p => (
                  <div key={p.id} className="p-4 flex items-start gap-3">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-14 h-14 object-cover rounded-xl shrink-0" />
                      : <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0"><Icon name="Package" size={22} className="text-gray-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category_name || "Без категории"}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">
                        {p.price != null ? `${p.price.toLocaleString("ru-RU")} ₽` : "Цена не указана"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditProduct(p); setShowProductForm(false); }}
                        className="p-2 text-gray-400 hover:text-green-600"><Icon name="Pencil" size={15} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={15} /></button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">Нет товаров</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── КАТЕГОРИИ ── */}
      {tab === "categories" && (
        <>
          {(showCatForm || editCat) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
              <h3 className="font-semibold text-gray-900 mb-4">{editCat ? "Редактировать категорию" : "Новая категория"}</h3>
              <CategoryForm
                initial={editCat || undefined}
                onSave={handleSaveCat}
                onCancel={() => { setShowCatForm(false); setEditCat(null); }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  <Badge className="mt-2 bg-gray-100 text-gray-500">{c.product_count || 0} товаров</Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditCat(c); setShowCatForm(false); }}
                    className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"><Icon name="Pencil" size={15} /></button>
                  <button onClick={() => handleDeleteCat(c.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Icon name="Trash2" size={15} /></button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-3 py-12 text-center text-gray-400 text-sm">Нет категорий</div>
            )}
          </div>
        </>
      )}

      {/* Подсказка по формату CSV */}
      {tab === "products" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">Формат CSV для импорта (разделитель «;»):</p>
          <p className="text-xs text-blue-600 font-mono">название;цена;цена_старая;категория;артикул;описание;в_наличии</p>
          <p className="text-xs text-blue-500 mt-1">Первая строка — заголовки. «в_наличии»: 1 = есть, 0 = нет</p>
        </div>
      )}
    </div>
  );
}