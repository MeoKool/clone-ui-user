"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Plus, Edit, Trash } from "lucide-react"
import DeleteConfirmDialog from "./dialogs/DeleteConfirmDialog"

import AddProductDialog from "./dialogs/AddProductDialog"
import ViewProductDialog from "./dialogs/ViewProductDialog"
import EditProductDialog from "./dialogs/EditProductDialog"

interface Product {
    productId: number
    productCode: string
    productName: string
    unit: string
    defaultExpiration: number
    categoryId: number
    description: string
    taxId: number
    createdBy: string
    createdDate: string
    updatedBy: string
    updatedDate: string
    availableStock: number
    images: string[]
    price?: number
    status?: string
}

interface Category {
    categoryId: number
    categoryName: string
    sortOrder: number
    notes: string
    isActive: boolean
    createdBy: string
    createdDate: string
}

interface ProductData {
    productCode: string
    productName: string
    unit: string
    defaultExpiration: number
    categoryId: number
    description: string
    taxId: number
    images: string[]
}

const ProductList = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    const [newProduct, setNewProduct] = useState<ProductData>({
        productCode: "",
        productName: "",
        unit: "",
        defaultExpiration: 30,
        categoryId: 0,
        description: "",
        taxId: 1,
        images: [],
    })

    const [editProduct, setEditProduct] = useState<ProductData>({
        productCode: "",
        productName: "",
        unit: "",
        defaultExpiration: 30,
        categoryId: 0,
        description: "",
        taxId: 1,
        images: [],
    })

    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [editImageUrls, setEditImageUrls] = useState<string[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    useEffect(() => {
        if (products.length > 0) {
            const filtered = products.filter(
                (product) =>
                    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            setFilteredProducts(filtered)
        }
    }, [searchTerm, products])

    const fetchProducts = async () => {
        setIsLoading(true)
        const token = localStorage.getItem("auth_token")

        if (!token) {
            alert("Lỗi: Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("https://minhlong.mlhr.org/api/product?page=1&pageSize=20", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()

            if (!Array.isArray(data)) {
                console.error("API response is not an array:", data)
                setProducts([])
                setFilteredProducts([])
                alert("Lỗi: Định dạng dữ liệu không hợp lệ. Vui lòng thử lại sau.")
                return
            }

            const validProducts = data.filter(
                (item) => item && typeof item === "object" && "productId" in item && "productName" in item,
            )

            setProducts(validProducts)
            setFilteredProducts(validProducts)
        } catch (error) {
            console.error("Error fetching products:", error)
            alert("Lỗi: Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.")
            setProducts([])
            setFilteredProducts([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchCategories = async () => {
        const token = localStorage.getItem("auth_token")
        if (!token) return

        try {
            const response = await fetch("https://minhlong.mlhr.org/api/product-category", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch categories")
            }

            const data = await response.json()
            setCategories(data.filter((cat: Category) => cat.isActive))
        } catch (error) {
            console.error("Error fetching categories:", error)
            alert("Lỗi: Không thể tải danh sách danh mục. Vui lòng thử lại sau.")
        }
    }

    const handleViewProductDetail = (product: Product) => {
        setSelectedProduct(product)
        setIsDialogOpen(true)
    }

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product)
        setEditProduct({
            productCode: product.productCode,
            productName: product.productName,
            unit: product.unit,
            defaultExpiration: product.defaultExpiration,
            categoryId: product.categoryId,
            description: product.description || "",
            taxId: product.taxId,
            images: product.images || [],
        })
        setEditImageUrls(product.images || [])
        setIsEditDialogOpen(true)
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const handleNewProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setNewProduct({
            ...newProduct,
            [name]: name === "defaultExpiration" ? Number.parseInt(value) || 0 : value,
        })
    }

    const handleEditProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setEditProduct({
            ...editProduct,
            [name]: name === "defaultExpiration" ? Number.parseInt(value) || 0 : value,
        })
    }

    const handleNewProductSelectChange = (name: string, value: string) => {
        setNewProduct({
            ...newProduct,
            [name]: name === "categoryId" ? Number.parseInt(value) : value,
        })
    }

    const handleEditProductSelectChange = (name: string, value: string) => {
        setEditProduct({
            ...editProduct,
            [name]: name === "categoryId" ? Number.parseInt(value) : value,
        })
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0])
        }
    }

    const handleUploadNewImage = async () => {
        await handleUploadImage(false)
    }

    const handleUploadEditImage = async () => {
        await handleUploadImage(true)
    }

    const handleUploadImage = async (isEdit: boolean) => {
        if (!imageFile) return

        setUploadingImage(true)
        const token = localStorage.getItem("auth_token")

        if (!token) {
            alert("Lỗi: Bạn chưa đăng nhập")
            setUploadingImage(false)
            return
        }

        try {
            const formData = new FormData()
            formData.append("file", imageFile)

            const response = await fetch("https://minhlong.mlhr.org/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            if (!response.ok) {
                throw new Error("Failed to upload image")
            }

            const data = await response.json()
            const imageUrl = data.url || data.imageUrl || data.path

            if (!imageUrl) {
                throw new Error("Image URL not found in response")
            }

            if (isEdit) {
                const newUrls = [...editImageUrls, imageUrl]
                setEditImageUrls(newUrls)
                setEditProduct({
                    ...editProduct,
                    images: newUrls,
                })
            } else {
                const newUrls = [...imageUrls, imageUrl]
                setImageUrls(newUrls)
                setNewProduct({
                    ...newProduct,
                    images: newUrls,
                })
            }

            setImageFile(null)
            alert("Thành công: Đã tải lên hình ảnh")
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Lỗi: Không thể tải lên hình ảnh. Vui lòng thử lại sau.")
        } finally {
            setUploadingImage(false)
        }
    }

    const handleRemoveNewImage = (index: number) => {
        const newUrls = [...imageUrls]
        newUrls.splice(index, 1)
        setImageUrls(newUrls)
        setNewProduct({
            ...newProduct,
            images: newUrls,
        })
    }

    const handleRemoveEditImage = (index: number) => {
        const newUrls = [...editImageUrls]
        newUrls.splice(index, 1)
        setEditImageUrls(newUrls)
        setEditProduct({
            ...editProduct,
            images: newUrls,
        })
    }

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const token = localStorage.getItem("auth_token")
        if (!token) {
            alert("Lỗi: Bạn chưa đăng nhập")
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch("https://minhlong.mlhr.org/api/product", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newProduct),
            })

            if (!response.ok) {
                throw new Error("Failed to add product")
            }

            await response.json()
            alert("Thành công: Đã thêm sản phẩm mới")

            setNewProduct({
                productCode: "",
                productName: "",
                unit: "",
                defaultExpiration: 30,
                categoryId: 0,
                description: "",
                taxId: 1,
                images: [],
            })
            setImageUrls([])
            setIsAddDialogOpen(false)

            fetchProducts()
        } catch (error) {
            console.error("Error adding product:", error)
            alert("Lỗi: Không thể thêm sản phẩm. Vui lòng thử lại sau.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct) return

        setIsSubmitting(true)

        const token = localStorage.getItem("auth_token")
        if (!token) {
            alert("Lỗi: Bạn chưa đăng nhập")
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch(`https://minhlong.mlhr.org/api/product/${selectedProduct.productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editProduct),
            })

            if (!response.ok) {
                throw new Error("Failed to update product")
            }

            await response.json()
            alert("Thành công: Đã cập nhật sản phẩm")

            setIsEditDialogOpen(false)
            fetchProducts()
        } catch (error) {
            console.error("Error updating product:", error)
            alert("Lỗi: Không thể cập nhật sản phẩm. Vui lòng thử lại sau.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteProduct = (product: Product) => {
        setProductToDelete(product)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!productToDelete) return

        setIsDeleting(true)
        const token = localStorage.getItem("auth_token")

        if (!token) {
            alert("Lỗi: Bạn chưa đăng nhập")
            setIsDeleting(false)
            return
        }

        try {
            const response = await fetch(`https://minhlong.mlhr.org/api/product/${productToDelete.productId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to delete product")
            }

            alert("Thành công: Đã xóa sản phẩm")
            setIsDeleteDialogOpen(false)
            setProductToDelete(null)
            fetchProducts()
        } catch (error) {
            console.error("Error deleting product:", error)
            alert("Lỗi: Không thể xóa sản phẩm. Vui lòng thử lại sau.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="w-1/3">
                    <Input
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm sản phẩm
                        </Button>
                        {isAddDialogOpen && (
                            <AddProductDialog
                                isOpen={isAddDialogOpen}
                                onClose={() => setIsAddDialogOpen(false)}
                                onSubmit={handleAddProduct}
                                product={newProduct}
                                setProduct={setNewProduct}
                                categories={categories}
                                isSubmitting={isSubmitting}
                                imageUrls={imageUrls}
                                imageFile={imageFile}
                                uploadingImage={uploadingImage}
                                handleInputChange={handleNewProductInputChange}
                                handleSelectChange={handleNewProductSelectChange}
                                handleImageChange={handleImageChange}
                                handleUploadImage={handleUploadNewImage}
                                handleRemoveImage={handleRemoveNewImage}
                            />
                        )}
                    </Dialog>
                    <Button onClick={fetchProducts} variant="outline">
                        Làm mới
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã sản phẩm</TableHead>
                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead>Đơn vị</TableHead>
                                    <TableHead>Tồn kho</TableHead>
                                    <TableHead>Ngày cập nhật</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.productId}>
                                            <TableCell>{product.productCode || "N/A"}</TableCell>
                                            <TableCell>{product.productName || "N/A"}</TableCell>
                                            <TableCell>{product.unit || "N/A"}</TableCell>
                                            <TableCell>{product.availableStock}</TableCell>
                                            <TableCell>{formatDate(product.updatedDate)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewProductDetail(product)}>
                                                        Chi tiết
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Sửa
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDeleteProduct(product)}
                                                    >
                                                        <Trash className="h-4 w-4 mr-1" />
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Không tìm thấy sản phẩm nào
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {selectedProduct && isDialogOpen && (
                    <ViewProductDialog
                        product={selectedProduct}
                        onClose={() => setIsDialogOpen(false)}
                        onEdit={() => {
                            setIsDialogOpen(false)
                            handleEditProduct(selectedProduct)
                        }}
                        formatDate={formatDate}
                    />
                )}
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {selectedProduct && isEditDialogOpen && (
                    <EditProductDialog
                        isOpen={isEditDialogOpen}
                        onClose={() => setIsEditDialogOpen(false)}
                        onSubmit={handleUpdateProduct}
                        product={editProduct}
                        setProduct={setEditProduct}
                        categories={categories}
                        isSubmitting={isSubmitting}
                        imageUrls={editImageUrls}
                        imageFile={imageFile}
                        uploadingImage={uploadingImage}
                        handleInputChange={handleEditProductInputChange}
                        handleSelectChange={handleEditProductSelectChange}
                        handleImageChange={handleImageChange}
                        handleUploadImage={handleUploadEditImage}
                        handleRemoveImage={handleRemoveEditImage}
                    />
                )}
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                {productToDelete && (
                    <DeleteConfirmDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleConfirmDelete}
                        title="Xác nhận xóa sản phẩm"
                        description={`Bạn có chắc chắn muốn xóa sản phẩm "${productToDelete.productName}" không? Hành động này không thể hoàn tác.`}
                        isDeleting={isDeleting}
                    />
                )}
            </Dialog>
        </div>
    )
}

export default ProductList

