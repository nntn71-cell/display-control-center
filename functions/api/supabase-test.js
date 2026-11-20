
export async function onRequest({ request }) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = request.headers.get("x-supabase-apikey");

  if (!key) {
    return new Response("Missing public API key", { status: 400 });
  }

  try {
    const response = await fetch(
      "https://qmymrgkrplinvjoewdqj.supabase.co/auth/v1/settings",
      {
        method: "GET",
        headers: {
          "apikey": key,
          "Authorization": "Bearer " + key,
          "Accept": "application/json"
        }
      }
    );

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return new Response(
      "Cloudflare could not reach Supabase: " + error.message,
      { status: 502 }
    );
  }
}
