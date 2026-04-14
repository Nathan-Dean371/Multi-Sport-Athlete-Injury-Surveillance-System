# Operations

This directory contains the deployment-time and edge-routing configuration for the system. It is intentionally small: the primary file here is the Nginx reverse proxy template used to route browser traffic to the backend API and the admin dashboard.

## Purpose

- Route public API traffic to the NestJS backend on port `3000`.
- Route admin dashboard traffic to the Next.js web app on port `3001`.
- Keep the reverse-proxy configuration separate from application source so it can be reused on a VM, EC2 instance, or any other Linux host.

## Contents

- `nginx/injury-surveillance-reverse-proxy.conf` - two virtual hosts, one for `api.yourdomain.com` and one for `admin.yourdomain.com`.

## How To Use It

1. Replace the placeholder `server_name` values with your real DNS names.
2. Copy the file to your Nginx host, usually under `sites-available` or an equivalent config directory.
3. Run `nginx -t` to validate the config.
4. Reload Nginx after the config passes validation.
5. If you are exposing the sites publicly, add TLS with Certbot or your preferred certificate workflow after DNS is in place.

Example commands on a Linux host:

```bash
sudo cp injury-surveillance-reverse-proxy.conf /etc/nginx/sites-available/injury-surveillance-reverse-proxy.conf
sudo ln -s /etc/nginx/sites-available/injury-surveillance-reverse-proxy.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Configuration Notes

- The bundled config only includes HTTP listeners on port `80`.
- TLS termination is expected to be added later, after the domain is live.
- The deployment workflow in `.github/workflows/ci.yml` copies this config to the target host as part of the EC2 deployment path, but the file still needs to be installed into Nginx manually or by a host bootstrap process.
- The backend deployment currently listens on `127.0.0.1:3000` and the admin dashboard on `127.0.0.1:3001`, which is what the proxy targets.

## Related Files

- [Backend runtime config](../backend/src/config/configuration.ts)
- [CI/CD workflow](../.github/workflows/ci.yml)
- [Web app documentation](../web/README.md)