import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useProduct } from "../hooks/useProduct.js";
import { Check, ImagePlus, LoaderCircle, X, PackagePlus } from "lucide-react";

const CreateProduct = () => {
  const { handleCreateProduct } = useProduct();
  const navigate = useNavigate();
  const successDialog = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isCreated) return;

    if (!successDialog.current.open) successDialog.current.showModal();
    const redirectTimer = setTimeout(() => {
      navigate("/seller/dashboard", { replace: true });
    }, 2000);

    return () => clearTimeout(redirectTimer);
  }, [isCreated, navigate]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceAmount: "",
    priceCurrency: "INR",
  });

  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addImages = (files) => {
    const selectedImages = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setImages((prev) => [...prev, ...selectedImages].slice(0, 7));
  };

  const handleImages = (e) => {
    addImages(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    addImages(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");

    const productData = new FormData();

    productData.append("title", formData.title);
    productData.append("description", formData.description);
    productData.append("priceAmount", formData.priceAmount);
    productData.append("priceCurrency", formData.priceCurrency);

    images.forEach((image) => {
      productData.append("images", image);
    });

    try {
      await handleCreateProduct(productData);
      setIsCreated(true);
    } catch (error) {
      setSubmitError(
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "We couldn't create your product. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-neutral-500">
            Seller Dashboard / Products
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Create a new product
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Add your product information, pricing and images. You can upload
            up to 7 product images.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="grid gap-6 lg:grid-cols-[1fr_340px]"
        >
          {/* LEFT SIDE */}
          <div className="space-y-6">
            {/* Product Information */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Product information
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Enter the basic details of your product.
                </p>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Product title
                  </label>

                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Oversized Cotton T-Shirt"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="description"
                      className="text-sm font-medium text-neutral-700"
                    >
                      Description
                    </label>

                    <span className="text-xs text-neutral-400">
                      {formData.description.length} characters
                    </span>
                  </div>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={7}
                    placeholder="Describe the product, material, fit, features..."
                    required
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Pricing
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Set the selling price for your product.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                {/* Currency */}
                <div>
                  <label
                    htmlFor="priceCurrency"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Currency
                  </label>

                  <select
                    id="priceCurrency"
                    name="priceCurrency"
                    value={formData.priceCurrency}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="priceAmount"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Price
                  </label>

                  <input
                    id="priceAmount"
                    type="number"
                    name="priceAmount"
                    value={formData.priceAmount}
                    onChange={handleChange}
                    placeholder="1999"
                    min="0"
                    required
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            {/* Product Images */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-neutral-900">
                    Product images
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    Add up to 7 images
                  </p>
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  {images.length}/7
                </span>
              </div>

              {/* Drag & Drop Upload Area */}
              {images.length < 7 && (
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    group flex cursor-pointer flex-col items-center justify-center
                    rounded-xl border-2 border-dashed px-4 py-8 text-center
                    transition-all duration-200
                    ${
                      isDragging
                        ? "scale-[1.02] border-neutral-900 bg-neutral-100"
                        : "border-neutral-200 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"
                    }
                  `}
                >
                  <div
                    className={`
                      mb-3 flex h-11 w-11 items-center justify-center
                      rounded-full border bg-white shadow-sm transition
                      ${
                        isDragging
                          ? "border-neutral-900"
                          : "border-neutral-200"
                      }
                    `}
                  >
                    <ImagePlus size={19} className="text-neutral-600" />
                  </div>

                  <p className="text-sm font-medium text-neutral-800">
                    {isDragging
                      ? "Drop images here"
                      : "Drag & drop product images"}
                  </p>

                  {!isDragging && (
                    <>
                      <p className="mt-1 text-xs text-neutral-400">
                        or click to browse
                      </p>

                      <p className="mt-2 text-[11px] text-neutral-400">
                        PNG, JPG or WEBP • Up to 7 images
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImages}
                    className="hidden"
                  />
                </label>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Product ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {/* Main Image Badge */}
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                          Main
                        </span>
                      )}

                      {/* Remove Image */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-neutral-700 opacity-0 shadow-md transition hover:bg-neutral-900 hover:text-white group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publish */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-neutral-900">
                Ready to publish?
              </h3>

              <p className="mt-1 text-sm leading-5 text-neutral-500">
                Make sure your product details and images are correct before
                creating the product.
              </p>

              {submitError && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" /> : <PackagePlus size={17} />}
                {isCreated ? "Product created" : isSubmitting ? "Creating product..." : "Create product"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <dialog
        ref={successDialog}
        aria-labelledby="product-created-title"
        aria-describedby="product-created-description"
        onClose={() => navigate("/seller/dashboard", { replace: true })}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-neutral-200 bg-[#fffefa] p-8 text-center shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#eeeede] text-[#5c6947]">
          <Check size={28} aria-hidden="true" />
        </div>
        <h2 id="product-created-title" className="text-2xl font-semibold tracking-tight text-neutral-900">
          Product created!
        </h2>
        <p id="product-created-description" className="mt-3 text-sm leading-6 text-neutral-500">
          Your product has been added. Taking you to My products...
        </p>
        <button
          type="button"
          onClick={() => navigate("/seller/dashboard", { replace: true })}
          className="mt-6 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
        >
          Go to My products
        </button>
      </dialog>
    </div>
  );
};

export default CreateProduct;
