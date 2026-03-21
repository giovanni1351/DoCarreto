"""arrumando o enum do usertype

Revision ID: e760c7431c49
Revises: e987abc75d61
Create Date: 2026-03-20 22:46:30.054478

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e760c7431c49"
down_revision: str | Sequence[str] | None = "e987abc75d61"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE usertypes ADD VALUE IF NOT EXISTS 'NAO_DEFINIDO'")


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            -- garante que nenhum registro fique com o valor removido
            UPDATE "user"
            SET tipo_user = 'CRIADOR_DEMANDA'
            WHERE tipo_user::text = 'NAO_DEFINIDO';

            CREATE TYPE usertypes_old AS ENUM ('CRIADOR_DEMANDA', 'ENTREGADOR');

            ALTER TABLE "user"
            ALTER COLUMN tipo_user
            TYPE usertypes_old
            USING tipo_user::text::usertypes_old;

            DROP TYPE usertypes;
            ALTER TYPE usertypes_old RENAME TO usertypes;
        END
        $$;
        """
    )
