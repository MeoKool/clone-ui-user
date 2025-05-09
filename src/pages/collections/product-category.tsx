import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/page-header"
import { ResponsiveContainer } from "@/components/responsive-container"
import { fetchProductCategories, fetchProductsByCategory } from "@/services/product-service"
import type { ProductCategory, ProductCard } from "@/services/product-service"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard as ProductCardComponent } from "@/components/product-card"

export default function ProductCategory() {
    // Get categoryId from URL params
    const { categoryId } = useParams<{ categoryId: string }>()

    // Simple state management
    const [categories, setCategories] = useState<ProductCategory[]>([])
    const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null)
    const [products, setProducts] = useState<ProductCard[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Load everything on component mount or when categoryId changes
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            setError(null)

            try {
                // 1. Fetch all categories
                const categoriesData = await fetchProductCategories()
                setCategories(categoriesData)

                // 2. Find current category if categoryId exists
                if (categoryId) {
                    const category = categoriesData.find((c) => c.categoryId.toString() === categoryId)
                    setCurrentCategory(category || null)

                    // 3. Fetch products for this category
                    if (category) {
                        const productsData = await fetchProductsByCategory(category.categoryId)
                        setProducts(productsData)

                        if (productsData.length === 0) {
                            setError("Không có sản phẩm nào trong danh mục này")
                        }
                    } else {
                        setError("Không tìm thấy danh mục sản phẩm")
                        setProducts([])
                    }
                } else {
                    // No categoryId, could fetch all products here if needed
                    setProducts([])
                }
            } catch (err) {
                console.error("Error loading data:", err)
                setError("Không thể tải dữ liệu. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [categoryId])

    return (
        <div className="py-12">
            <ResponsiveContainer maxWidth="3xl">
                <PageHeader
                    title={currentCategory?.categoryName || "Sản phẩm"}
                    description={currentCategory?.notes || "Khám phá các sản phẩm chất lượng cao của chúng tôi"}
                />

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Categories sidebar */}
                    <div className="lg:w-1/5 xl:w-1/6">
                        <div className="bg-white p-6 rounded-lg border sticky top-24">
                            <h3 className="font-medium text-lg mb-4">Danh mục</h3>
                            {categories.length === 0 ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    <li>
                                        <Link to="/collections" className="text-muted-foreground hover:text-primary">
                                            Tất cả sản phẩm
                                        </Link>
                                    </li>
                                    {categories
                                        .filter((cat) => cat.isActive)
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((category) => (
                                            <li key={category.categoryId}>
                                                <Link
                                                    to={`/collections/${category.categoryId}`}
                                                    className={`${categoryId === category.categoryId.toString()
                                                        ? "text-primary font-medium"
                                                        : "text-muted-foreground"
                                                        } hover:text-primary`}
                                                >
                                                    {category.categoryName}
                                                </Link>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Products grid */}
                    <div className="lg:w-4/5 xl:w-5/6">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white p-4 rounded-lg border">
                                        <Skeleton className="aspect-square w-full mb-4" />
                                        <Skeleton className="h-6 w-3/4 mb-2" />
                                        <div className="flex justify-end">
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {products.length === 0 ? (
                                    <div className="bg-muted/20 rounded-lg p-8 text-center">
                                        <h3 className="text-lg font-medium mb-2">Không có sản phẩm</h3>
                                        <p className="text-muted-foreground">Hiện tại không có sản phẩm nào trong danh mục này.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {products.map((product) => (
                                            <ProductCardComponent key={product.productId} product={product} categoryId={categoryId || ""} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </ResponsiveContainer>
        </div>
    )
}

