# Generated by Django 4.2.23 on 2025-06-12 08:40

import django.core.validators
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Account",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "billing_address_street",
                    models.CharField(blank=True, max_length=255),
                ),
                ("billing_address_city", models.CharField(blank=True, max_length=100)),
                ("billing_address_state", models.CharField(blank=True, max_length=100)),
                (
                    "billing_address_country",
                    models.CharField(blank=True, max_length=100),
                ),
                (
                    "billing_address_postal_code",
                    models.CharField(blank=True, max_length=20),
                ),
                (
                    "shipping_address_street",
                    models.CharField(blank=True, max_length=255),
                ),
                ("shipping_address_city", models.CharField(blank=True, max_length=100)),
                (
                    "shipping_address_state",
                    models.CharField(blank=True, max_length=100),
                ),
                (
                    "shipping_address_country",
                    models.CharField(blank=True, max_length=100),
                ),
                (
                    "shipping_address_postal_code",
                    models.CharField(blank=True, max_length=20),
                ),
                ("email_address", models.EmailField(blank=True, max_length=254)),
                ("email_address_is_opted_out", models.BooleanField(default=False)),
                ("email_address_is_invalid", models.BooleanField(default=False)),
                ("phone_number", models.CharField(blank=True, max_length=50)),
                ("phone_number_is_opted_out", models.BooleanField(default=False)),
                ("phone_number_is_invalid", models.BooleanField(default=False)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("name", models.CharField(max_length=255)),
                ("website", models.URLField(blank=True)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("customer", "Customer"),
                            ("partner", "Partner"),
                            ("reseller", "Reseller"),
                            ("competitor", "Competitor"),
                            ("supplier", "Supplier"),
                            ("investor", "Investor"),
                        ],
                        default="customer",
                        max_length=50,
                    ),
                ),
                ("industry", models.CharField(blank=True, max_length=100)),
                ("sic_code", models.CharField(blank=True, max_length=20)),
                (
                    "annual_revenue",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=15, null=True
                    ),
                ),
                ("employees", models.IntegerField(blank=True, null=True)),
                ("vat_id", models.CharField(blank=True, max_length=50)),
                ("vat_id_is_valid", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Account",
                "verbose_name_plural": "Accounts",
                "db_table": "accounts",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Call",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("name", models.CharField(max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("planned", "Planned"),
                            ("held", "Held"),
                            ("not_held", "Not Held"),
                        ],
                        default="planned",
                        max_length=50,
                    ),
                ),
                (
                    "direction",
                    models.CharField(
                        choices=[("outbound", "Outbound"), ("inbound", "Inbound")],
                        default="outbound",
                        max_length=20,
                    ),
                ),
                ("date_start", models.DateTimeField()),
                ("date_end", models.DateTimeField()),
                (
                    "duration",
                    models.IntegerField(
                        blank=True, help_text="Duration in minutes", null=True
                    ),
                ),
                ("parent_type", models.CharField(blank=True, max_length=100)),
                ("parent_id", models.UUIDField(blank=True, null=True)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Call",
                "verbose_name_plural": "Calls",
                "db_table": "calls",
                "ordering": ["-date_start"],
            },
        ),
        migrations.CreateModel(
            name="CallContact",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("accepted", "Accepted"),
                            ("declined", "Declined"),
                            ("tentative", "Tentative"),
                        ],
                        default="none",
                        max_length=20,
                    ),
                ),
            ],
            options={
                "db_table": "call_contacts",
            },
        ),
        migrations.CreateModel(
            name="CallUser",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("accepted", "Accepted"),
                            ("declined", "Declined"),
                            ("tentative", "Tentative"),
                        ],
                        default="none",
                        max_length=20,
                    ),
                ),
            ],
            options={
                "db_table": "call_users",
            },
        ),
        migrations.CreateModel(
            name="Contact",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("address_street", models.CharField(blank=True, max_length=255)),
                ("address_city", models.CharField(blank=True, max_length=100)),
                ("address_state", models.CharField(blank=True, max_length=100)),
                ("address_country", models.CharField(blank=True, max_length=100)),
                ("address_postal_code", models.CharField(blank=True, max_length=20)),
                ("email_address", models.EmailField(blank=True, max_length=254)),
                ("email_address_is_opted_out", models.BooleanField(default=False)),
                ("email_address_is_invalid", models.BooleanField(default=False)),
                ("phone_number", models.CharField(blank=True, max_length=50)),
                ("phone_number_is_opted_out", models.BooleanField(default=False)),
                ("phone_number_is_invalid", models.BooleanField(default=False)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("middle_name", models.CharField(blank=True, max_length=100)),
                (
                    "salutation_name",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("mr", "Mr."),
                            ("mrs", "Mrs."),
                            ("ms", "Ms."),
                            ("dr", "Dr."),
                            ("prof", "Prof."),
                        ],
                        max_length=20,
                    ),
                ),
                ("title", models.CharField(blank=True, max_length=100)),
                ("department", models.CharField(blank=True, max_length=100)),
                ("do_not_call", models.BooleanField(default=False)),
                ("twitter", models.CharField(blank=True, max_length=100)),
                ("linkedin", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Contact",
                "verbose_name_plural": "Contacts",
                "db_table": "contacts",
                "ordering": ["last_name", "first_name"],
            },
        ),
        migrations.CreateModel(
            name="Lead",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("address_street", models.CharField(blank=True, max_length=255)),
                ("address_city", models.CharField(blank=True, max_length=100)),
                ("address_state", models.CharField(blank=True, max_length=100)),
                ("address_country", models.CharField(blank=True, max_length=100)),
                ("address_postal_code", models.CharField(blank=True, max_length=20)),
                ("email_address", models.EmailField(blank=True, max_length=254)),
                ("email_address_is_opted_out", models.BooleanField(default=False)),
                ("email_address_is_invalid", models.BooleanField(default=False)),
                ("phone_number", models.CharField(blank=True, max_length=50)),
                ("phone_number_is_opted_out", models.BooleanField(default=False)),
                ("phone_number_is_invalid", models.BooleanField(default=False)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                (
                    "salutation_name",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("mr", "Mr."),
                            ("mrs", "Mrs."),
                            ("ms", "Ms."),
                            ("dr", "Dr."),
                            ("prof", "Prof."),
                        ],
                        max_length=20,
                    ),
                ),
                ("title", models.CharField(blank=True, max_length=100)),
                ("account_name", models.CharField(blank=True, max_length=255)),
                ("website", models.URLField(blank=True)),
                ("industry", models.CharField(blank=True, max_length=100)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "New"),
                            ("assigned", "Assigned"),
                            ("in_process", "In Process"),
                            ("converted", "Converted"),
                            ("recycled", "Recycled"),
                            ("dead", "Dead"),
                        ],
                        default="new",
                        max_length=50,
                    ),
                ),
                (
                    "source",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("call", "Call"),
                            ("email", "Email"),
                            ("existing_customer", "Existing Customer"),
                            ("partner", "Partner"),
                            ("public_relations", "Public Relations"),
                            ("web_site", "Web Site"),
                            ("campaign", "Campaign"),
                            ("other", "Other"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "opportunity_amount",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=15, null=True
                    ),
                ),
                (
                    "opportunity_amount_currency",
                    models.CharField(default="USD", max_length=3),
                ),
                ("do_not_call", models.BooleanField(default=False)),
                ("converted_at", models.DateTimeField(blank=True, null=True)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Lead",
                "verbose_name_plural": "Leads",
                "db_table": "leads",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Opportunity",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("name", models.CharField(max_length=255)),
                (
                    "amount",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=15, null=True
                    ),
                ),
                ("amount_currency", models.CharField(default="USD", max_length=3)),
                (
                    "stage",
                    models.CharField(
                        choices=[
                            ("prospecting", "Prospecting"),
                            ("qualification", "Qualification"),
                            ("needs_analysis", "Needs Analysis"),
                            ("value_proposition", "Value Proposition"),
                            ("id_decision_makers", "Id. Decision Makers"),
                            ("perception_analysis", "Perception Analysis"),
                            ("proposal_price_quote", "Proposal/Price Quote"),
                            ("negotiation_review", "Negotiation/Review"),
                            ("closed_won", "Closed Won"),
                            ("closed_lost", "Closed Lost"),
                        ],
                        default="prospecting",
                        max_length=50,
                    ),
                ),
                (
                    "probability",
                    models.IntegerField(
                        default=0,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("close_date", models.DateField()),
                ("last_stage", models.CharField(blank=True, max_length=50)),
                (
                    "lead_source",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("call", "Call"),
                            ("email", "Email"),
                            ("existing_customer", "Existing Customer"),
                            ("partner", "Partner"),
                            ("public_relations", "Public Relations"),
                            ("web_site", "Web Site"),
                            ("campaign", "Campaign"),
                            ("other", "Other"),
                        ],
                        max_length=50,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("next_step", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Opportunity",
                "verbose_name_plural": "Opportunities",
                "db_table": "opportunities",
                "ordering": ["-close_date"],
            },
        ),
        migrations.CreateModel(
            name="OpportunityContact",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("decision_maker", "Decision Maker"),
                            ("evaluator", "Evaluator"),
                            ("influencer", "Influencer"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=50,
                    ),
                ),
                ("is_primary", models.BooleanField(default=False)),
            ],
            options={
                "verbose_name": "Opportunity Contact",
                "verbose_name_plural": "Opportunity Contacts",
                "db_table": "opportunity_contacts",
            },
        ),
        migrations.CreateModel(
            name="Task",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("modified_at", models.DateTimeField(auto_now=True)),
                ("deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("name", models.CharField(max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("not_started", "Not Started"),
                            ("started", "Started"),
                            ("completed", "Completed"),
                            ("canceled", "Canceled"),
                            ("deferred", "Deferred"),
                        ],
                        default="not_started",
                        max_length=50,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("normal", "Normal"),
                            ("high", "High"),
                            ("urgent", "Urgent"),
                        ],
                        default="normal",
                        max_length=20,
                    ),
                ),
                ("date_start", models.DateTimeField(blank=True, null=True)),
                ("date_end", models.DateTimeField(blank=True, null=True)),
                ("date_completed", models.DateTimeField(blank=True, null=True)),
                ("parent_type", models.CharField(blank=True, max_length=100)),
                ("parent_id", models.UUIDField(blank=True, null=True)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "verbose_name": "Task",
                "verbose_name_plural": "Tasks",
                "db_table": "tasks",
                "ordering": ["-date_start"],
            },
        ),
    ]
