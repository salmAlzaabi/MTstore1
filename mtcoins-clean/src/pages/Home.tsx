import { useState, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { APP_LOGO } from "@/const";
import { toast } from "sonner";

interface Product {
  id: number;
  coins: number;
  price_credits: number;
  image_url: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discordUsername, setDiscordUsername] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomQuantityOpen, setIsCustomQuantityOpen] = useState(false);
  const [customQuantity, setCustomQuantity] = useState(1000);
  const [loading, setLoading] = useState(true);

  // Load products from JSON
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/products.json");
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast.error("Failed to load products");
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity }]);
    }

    toast.success(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
    toast.success("Removed from cart");
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalCoins = () => {
    return cart.reduce((sum, item) => sum + item.coins * item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price_credits * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!discordUsername.trim()) {
      toast.error("Please enter your Discord username or ID");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const totalCoins = getTotalCoins();
    const totalPrice = getTotalPrice();
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Prepare webhook payload
    const payload = {
      content: "🎮 **New MTcoins Purchase Order**",
      embeds: [
        {
          title: "طلب شراء كوينز جديد - MTcoins",
          color: 0xff0000,
          fields: [
            {
              name: "الكمية الإجمالية",
              value: `${totalCoins.toLocaleString()} Coins`,
              inline: true,
            },
            {
              name: "قيمة الدفع بالكردت",
              value: `${totalPrice.toLocaleString()} Credits`,
              inline: true,
            },
            {
              name: "يوزر اللاعب (Discord)",
              value: discordUsername,
              inline: false,
            },
            {
              name: "وقت وتاريخ الطلب",
              value: timestamp,
              inline: false,
            },
            {
              name: "تفاصيل الطلب",
              value: cart
                .map((item) => `${item.name} x${item.quantity}`)
                .join("\n"),
              inline: false,
            },
          ],
        },
      ],
    };

    // Send webhook to Discord
    try {
      const webhookUrl = "https://discord.com/api/webhooks/1439675035487961240/EjDsWK_YE-a-VO_j0SzYRvH9UkcNyXqFYzCmllBT4qiHZfu3t6XaNuFhx68XnEWNz2bx";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      console.log("Webhook sent successfully:", payload);
      toast.success("تم تسجيل طلبك بنجاح، سيتم التواصل معك من قبل الإدارة");
    } catch (error) {
      console.error("Webhook error:", error);
      toast.error("حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى.");
      return;
    }

    // Reset cart and form
    setCart([]);
    setDiscordUsername("");
    setIsCartOpen(false);
  };

  const handleCustomQuantitySubmit = () => {
    if (customQuantity < 1000) {
      toast.error("Minimum quantity is 1000 coins");
      return;
    }

    const customProduct: Product = {
      id: -1,
      coins: customQuantity,
      price_credits: customQuantity * 2,
      image_url: "/images/coins_custom.png",
      name: `${customQuantity.toLocaleString()} Coins (Custom)`,
    };

    addToCart(customProduct);
    setIsCustomQuantityOpen(false);
    setCustomQuantity(1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading MTcoins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO}
              alt="MTcoins Logo"
              className="h-10 w-10 rounded-lg"
            />
            <h1 className="text-2xl font-bold text-white">MTcoins</h1>
          </div>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-white hover:bg-slate-700 rounded-lg transition-colors duration-200"
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Welcome to MTcoins Shop
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Purchase coins to enhance your gaming experience
          </p>
        </div>

        {/* Custom Quantity Button */}
        <div className="text-center mb-12">
          <Button
            onClick={() => setIsCustomQuantityOpen(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105"
          >
            💎 شراء بكمية مخصصة (Custom Quantity)
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="bg-slate-800 rounded-lg overflow-hidden hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-105 h-full flex flex-col">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {product.name}
                    </h3>
                    <p className="text-red-400 text-sm mb-2">
                      💳 {product.price_credits.toLocaleString()} Credits
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Custom Quantity Modal */}
      <Dialog open={isCustomQuantityOpen} onOpenChange={setIsCustomQuantityOpen}>
        <DialogContent className="bg-slate-800 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              شراء بكمية مخصصة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-semibold">
                كمية الكوينز المطلوبة
              </label>
              <Input
                type="number"
                min="1000"
                step="100"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(Number(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-slate-400 text-sm mt-2">
                الحد الأدنى: 1000 كوينز
              </p>
            </div>

            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-slate-300 mb-2">السعر المقابل:</p>
              <p className="text-2xl font-bold text-red-400">
                {(customQuantity * 2).toLocaleString()} Credits
              </p>
              <p className="text-slate-400 text-sm mt-2">
                (500 كوينز = 1000 كردت)
              </p>
            </div>

            <Button
              onClick={handleCustomQuantitySubmit}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 rounded-lg font-bold"
            >
              إضافة إلى السلة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="bg-slate-800 border border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Shopping Cart
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cart Items */}
            {cart.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Your cart is empty
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-700 p-4 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{item.name}</p>
                      <p className="text-slate-400 text-sm">
                        {item.price_credits.toLocaleString()} Credits each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Minus className="h-4 w-4 text-white" />
                      </button>
                      <span className="text-white font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 p-1 hover:bg-red-600 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Discord Username Input */}
            {cart.length > 0 && (
              <div>
                <label className="block text-white mb-2 font-semibold">
                  Discord Username / Discord ID
                </label>
                <Input
                  type="text"
                  placeholder="Enter your Discord username or ID"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
            )}

            {/* Total Price */}
            {cart.length > 0 && (
              <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30 p-4 rounded-lg">
                <p className="text-slate-300 mb-2">Total Coins:</p>
                <p className="text-2xl font-bold text-red-400 mb-4">
                  {getTotalCoins().toLocaleString()} Coins
                </p>
                <p className="text-slate-300 mb-2">Total Price:</p>
                <p className="text-3xl font-bold text-white">
                  {getTotalPrice().toLocaleString()} Credits
                </p>
              </div>
            )}

            {/* Checkout Button */}
            {cart.length > 0 && (
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105"
              >
                ✓ Confirm Purchase
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
