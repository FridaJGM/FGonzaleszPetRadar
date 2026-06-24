import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { LostPet } from '../lost-pets/lost-pet.entity';
import { FoundPet } from '../found-pets/found-pet.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !port || !user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
    return this.transporter;
  }

  private buildMapboxStaticUrl(params: {
    lostLng: number;
    lostLat: number;
    foundLng: number;
    foundLat: number;
  }): string | null {
    const token = this.config.get<string>('MAPBOX_ACCESS_TOKEN');
    if (!token) return null;

    const markers = [
      `pin-s-p+e11d48(${params.lostLng},${params.lostLat})`,
      `pin-s-f+1d4ed8(${params.foundLng},${params.foundLat})`,
    ].join(',');

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/auto/600x400?access_token=${token}`;
  }

  async notifyLostPetOwner(params: {
    lostPet: LostPet;
    foundPet: FoundPet;
    distanceMeters: number;
  }): Promise<{ sent: boolean; reason?: string }> {
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn('SMTP no configurado. Se omite el envío de correo.');
      return { sent: false, reason: 'SMTP no configurado' };
    }

    const generic = this.config.get<string>('GENERIC_NOTIFY_EMAIL');
    const to = [params.lostPet.owner_email, generic].filter(Boolean).join(',');
    const from =
      this.config.get<string>('EMAIL_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'no-reply@petradar.local';

    const mapUrl = this.buildMapboxStaticUrl({
      lostLng: params.lostPet.lng,
      lostLat: params.lostPet.lat,
      foundLng: params.foundPet.lng,
      foundLat: params.foundPet.lat,
    });

    const subject = `PetRadar: posible coincidencia (${params.lostPet.name}) a ${Math.round(
      params.distanceMeters,
    )}m`;

    const html = `
      <h2>PetRadar - Mascota encontrada cerca</h2>
      <p>Se registró una mascota encontrada cerca del punto donde reportaste a <b>${params.lostPet.name}</b>.</p>

      <h3>Datos de la mascota encontrada</h3>
      <ul>
        <li><b>Especie</b>: ${params.foundPet.species}</li>
        <li><b>Raza</b>: ${params.foundPet.breed ?? 'No identificada'}</li>
        <li><b>Color</b>: ${params.foundPet.color}</li>
        <li><b>Tamaño</b>: ${params.foundPet.size}</li>
        <li><b>Descripción</b>: ${params.foundPet.description}</li>
        <li><b>Dirección aprox.</b>: ${params.foundPet.address}</li>
        <li><b>Distancia</b>: ${Math.round(params.distanceMeters)} metros</li>
      </ul>

      <h3>Contacto de quien la encontró</h3>
      <ul>
        <li><b>Nombre</b>: ${params.foundPet.finder_name}</li>
        <li><b>Email</b>: ${params.foundPet.finder_email}</li>
        <li><b>Teléfono</b>: ${params.foundPet.finder_phone}</li>
      </ul>

      ${
        mapUrl
          ? `<h3>Mapa</h3><p><img src="${mapUrl}" alt="Mapa (perdida vs encontrada)" /></p>`
          : `<p><i>Mapa no disponible (falta MAPBOX_ACCESS_TOKEN).</i></p>`
      }
    `;

    await transporter.sendMail({ from, to, subject, html });
    return { sent: true };
  }
}
