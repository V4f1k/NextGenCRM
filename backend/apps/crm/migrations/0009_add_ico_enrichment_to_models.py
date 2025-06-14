# Generated by Django 4.2.23 on 2025-06-13 18:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm", "0008_add_ico_enrichment_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="business_activities",
            field=models.JSONField(
                blank=True, default=list, help_text="NACE codes and descriptions"
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="ico",
            field=models.CharField(
                blank=True, help_text="Czech business ID", max_length=20
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="ico_enriched",
            field=models.BooleanField(
                default=False, help_text="Data enriched from Czech ARES registry"
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="ico_enriched_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="account",
            name="legal_form",
            field=models.CharField(
                blank=True, help_text="Legal form from ARES", max_length=100
            ),
        ),
        migrations.AddField(
            model_name="account",
            name="legal_form_code",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="account",
            name="registration_date",
            field=models.DateField(
                blank=True, help_text="Company registration date", null=True
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="business_activities",
            field=models.JSONField(
                blank=True, default=list, help_text="NACE codes and descriptions"
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="ico",
            field=models.CharField(
                blank=True, help_text="Czech business ID", max_length=20
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="ico_enriched",
            field=models.BooleanField(
                default=False, help_text="Data enriched from Czech ARES registry"
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="ico_enriched_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="lead",
            name="legal_form",
            field=models.CharField(
                blank=True, help_text="Legal form from ARES", max_length=100
            ),
        ),
        migrations.AddField(
            model_name="lead",
            name="legal_form_code",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="lead",
            name="registration_date",
            field=models.DateField(
                blank=True, help_text="Company registration date", null=True
            ),
        ),
        migrations.AddField(
            model_name="opportunity",
            name="ico",
            field=models.CharField(
                blank=True,
                help_text="Czech business ID (if different from account)",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="opportunity",
            name="ico_enriched",
            field=models.BooleanField(
                default=False, help_text="Data enriched from Czech ARES registry"
            ),
        ),
        migrations.AddField(
            model_name="opportunity",
            name="ico_enriched_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="account",
            index=models.Index(fields=["name"], name="accounts_name_94ecef_idx"),
        ),
        migrations.AddIndex(
            model_name="account",
            index=models.Index(fields=["ico"], name="accounts_ico_c72572_idx"),
        ),
        migrations.AddIndex(
            model_name="account",
            index=models.Index(
                fields=["ico_enriched"], name="accounts_ico_enr_177124_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["status"], name="leads_status_94f025_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["ico"], name="leads_ico_4910a8_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(
                fields=["ico_enriched"], name="leads_ico_enr_e1e3de_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="opportunity",
            index=models.Index(fields=["stage"], name="opportuniti_stage_adb5b9_idx"),
        ),
        migrations.AddIndex(
            model_name="opportunity",
            index=models.Index(
                fields=["close_date"], name="opportuniti_close_d_92d7b4_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="opportunity",
            index=models.Index(fields=["ico"], name="opportuniti_ico_2dff60_idx"),
        ),
    ]
