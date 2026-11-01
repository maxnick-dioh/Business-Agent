import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    await client.db("admin").command({ ping: 1 });

    return Response.json({
      success: true,
      message: "MongoDB connection successful!",
    });
  } catch (error) {
    console.error("MongoDB connection test failed:", error);

    return Response.json(
      {
        success: false,
        message: "MongoDB connection failed. Check the server terminal.",
      },
      { status: 500 }
    );
  }
}