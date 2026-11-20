
export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const prefix = "/api/supabase-proxy/";
  const path = incoming.pathname.slice(prefix.length);

  if (
    !path ||
    !/^(auth|rest)\/v1\//.test(path) ||
    path.includes("..") ||
    path.includes("\\")
  ) {
    return new Response("Invalid Supabase request path", {
      status: 400
    });
  }

  const target = new URL(
    "https://qmymrgkrplinvjoewdqj.supabase.co/" + path
  );
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");

  const options = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    options.body = request.body;
  }

  try {
    const response = await fetch(target.toString(), options);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Cache-Control", "no-store");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response("Proxy error: " + error.message, {
      status: 502
    });
  }
}

