<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;

class LowStockNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $producto;
    public $proveedor;
    public $cantidadActual;
    public $stockMinimo;
    public $empresa;

    /**
     * Create a new message instance.
     */
    public function __construct($producto, $proveedor, $cantidadActual, $stockMinimo)
    {
        $this->producto = $producto;
        $this->proveedor = $proveedor;
        $this->cantidadActual = $cantidadActual;
        $this->stockMinimo = $stockMinimo;
        $this->empresa = \App\Models\CompanySetting::first();
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(config('mail.from.address'), 'Erick Rodriguez - ULEAM'),
            replyTo: [
                new Address(config('mail.from.address'), 'Erick Rodriguez'),
            ],
            subject: 'Consulta sobre disponibilidad - ' . $this->producto->nombre,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.low_stock',
            text: 'emails.low_stock_text',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
